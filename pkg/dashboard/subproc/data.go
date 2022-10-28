package subproc

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hexops/gotextdiff"
	"github.com/hexops/gotextdiff/myers"
	"github.com/hexops/gotextdiff/span"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

type DataLayer struct {
	KubeContext string
	Helm        string
	Kubectl     string
	Scanners    []Scanner
	VersionInfo *VersionInfo
	Namespace   string
}

type VersionInfo struct {
	CurVer    string
	LatestVer string
}

func (d *DataLayer) runCommand(cmd ...string) (string, error) {
	for i, c := range cmd {
		if c == "--namespace" && i < len(cmd) { // TODO: in case it's not found - add it?
			d.forceNamespace(&cmd[i+1])
		}
	}

	return utils.RunCommand(cmd, map[string]string{"HELM_KUBECONTEXT": d.KubeContext})
}

func (d *DataLayer) runCommandHelm(cmd ...string) (string, error) {
	if d.Helm == "" {
		d.Helm = "helm"
	}

	cmd = append([]string{d.Helm}, cmd...)
	if d.KubeContext != "" {
		cmd = append(cmd, "--kube-context", d.KubeContext)
	}

	return d.runCommand(cmd...)
}

func (d *DataLayer) runCommandKubectl(cmd ...string) (string, error) {
	if d.Kubectl == "" {
		d.Kubectl = "kubectl"
	}

	cmd = append([]string{d.Kubectl}, cmd...)

	if d.KubeContext != "" {
		cmd = append(cmd, "--context", d.KubeContext)
	}

	return d.runCommand(cmd...)
}

func (d *DataLayer) forceNamespace(s *string) {
	if d.Namespace != "" {
		*s = d.Namespace
	}
}

func (d *DataLayer) CheckConnectivity() error {
	contexts, err := d.ListContexts()
	if err != nil {
		return err
	}

	if len(contexts) < 1 {
		return errors.New("did not find any kubectl contexts configured")
	}

	_, err = d.runCommandHelm("--help") // no point in doing is, since the default context may be invalid
	if err != nil {
		return err
	}

	return nil
}

type KubeContext struct {
	IsCurrent bool
	Name      string
	Cluster   string
	AuthInfo  string
	Namespace string
}

func (d *DataLayer) ListContexts() (res []KubeContext, err error) {
	out, err := d.runCommandKubectl("config", "get-contexts")
	if err != nil {
		return nil, err
	}

	// kubectl has no JSON output for it, we'll have to do custom text parsing
	lines := strings.Split(out, "\n")

	// find field positions
	fields := regexp.MustCompile(`(\w+\s+)`).FindAllString(lines[0], -1)
	cur := len(fields[0])
	name := cur + len(fields[1])
	cluster := name + len(fields[2])
	auth := cluster + len(fields[3])

	// read items
	for _, line := range lines[1:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		res = append(res, KubeContext{
			IsCurrent: strings.TrimSpace(line[0:cur]) == "*",
			Name:      strings.TrimSpace(line[cur:name]),
			Cluster:   strings.TrimSpace(line[name:cluster]),
			AuthInfo:  strings.TrimSpace(line[cluster:auth]),
			Namespace: strings.TrimSpace(line[auth:]),
		})
	}

	return res, nil
}

func (d *DataLayer) ListInstalled() (res []ReleaseElement, err error) {
	cmd := []string{"ls", "--all", "--output", "json", "--time-format", time.RFC3339}

	// TODO: filter by namespace
	if d.Namespace == "" {
		cmd = append(cmd, "--all-namespaces")
	} else {
		cmd = append(cmd, "--namespace", d.Namespace)
	}

	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartHistory(namespace string, chartName string) (res []*HistoryElement, err error) {
	// TODO: there is `max` but there is no `offset`
	out, err := d.runCommandHelm("history", chartName, "--namespace", namespace, "--output", "json", "--max", "18")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	for _, elm := range res {
		chartRepoName, curVer, err := utils.ChartAndVersion(elm.Chart)
		if err != nil {
			return nil, err
		}
		elm.ChartName = chartRepoName
		elm.ChartVer = curVer
		elm.Updated.Time = elm.Updated.Time.Round(time.Second)
	}

	return res, nil
}

func (d *DataLayer) ChartRepoVersions(chartName string) (res []*RepoChartElement, err error) {
	search := "/" + chartName + "\v"
	if strings.Contains(chartName, "/") {
		search = "\v" + chartName + "\v"
	}

	cmd := []string{"search", "repo", "--regexp", search, "--versions", "--output", "json"}
	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartRepoCharts(repoName string) (res []*RepoChartElement, err error) {
	cmd := []string{"search", "repo", "--regexp", "\v" + repoName + "/", "--output", "json"}
	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	ins, err := d.ListInstalled()
	if err != nil {
		return nil, err
	}

	enrichRepoChartsWithInstalled(res, ins)

	return res, nil
}

func enrichRepoChartsWithInstalled(charts []*RepoChartElement, installed []ReleaseElement) {
	for _, chart := range charts {
		for _, rel := range installed {
			c, _, err := utils.ChartAndVersion(rel.Chart)
			if err != nil {
				log.Warnf("Failed to parse chart: %s", err)
				continue
			}

			pieces := strings.Split(chart.Name, "/")
			if pieces[1] == c {
				// TODO: there can be more than one
				chart.InstalledNamespace = rel.Namespace
				chart.InstalledName = rel.Name
			}
		}
	}
}

type SectionFn = func(string, string, int, bool) (string, error) // TODO: rework it into struct-based argument?

func (d *DataLayer) RevisionManifests(namespace string, chartName string, revision int, _ bool) (res string, err error) {
	cmd := []string{"get", "manifest", chartName, "--namespace", namespace}
	if revision > 0 {
		cmd = append(cmd, "--revision", strconv.Itoa(revision))
	}

	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (d *DataLayer) RevisionManifestsParsed(namespace string, chartName string, revision int) ([]*v1.Carp, error) {
	out, err := d.RevisionManifests(namespace, chartName, revision, false)
	if err != nil {
		return nil, err
	}

	dec := yaml.NewDecoder(bytes.NewReader([]byte(out)))

	res := make([]*v1.Carp, 0)
	var tmp interface{}
	for dec.Decode(&tmp) == nil {
		// k8s libs uses only JSON tags defined, say hello to https://github.com/go-yaml/yaml/issues/424
		// bug we can juggle it
		jsoned, err := json.Marshal(tmp)
		if err != nil {
			return nil, err
		}

		var doc v1.Carp
		err = json.Unmarshal(jsoned, &doc)
		if err != nil {
			return nil, err
		}

		if doc.Kind == "" {
			log.Warnf("Manifest piece is not k8s resource: %s", jsoned)
			continue
		}

		res = append(res, &doc)
	}

	return res, nil
}

func (d *DataLayer) RevisionNotes(namespace string, chartName string, revision int, _ bool) (res string, err error) {
	out, err := d.runCommandHelm("get", "notes", chartName, "--namespace", namespace, "--revision", strconv.Itoa(revision))
	if err != nil {
		return "", err
	}
	return out, nil
}

func (d *DataLayer) RevisionValues(namespace string, chartName string, revision int, onlyUserDefined bool) (res string, err error) {
	cmd := []string{"get", "values", chartName, "--namespace", namespace, "--output", "yaml"}

	if revision > 0 {
		cmd = append(cmd, "--revision", strconv.Itoa(revision))
	}

	if !onlyUserDefined {
		cmd = append(cmd, "--all")
	}
	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (d *DataLayer) GetResource(namespace string, def *v1.Carp) (*v1.Carp, error) {
	out, err := d.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "json")
	if err != nil {
		if strings.HasSuffix(strings.TrimSpace(err.Error()), " not found") {
			return &v1.Carp{
				Status: v1.CarpStatus{
					Phase:   "NotFound",
					Message: err.Error(),
					Reason:  "not found",
				},
			}, nil
		} else {
			return nil, err
		}
	}

	var res v1.Carp
	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	sort.Slice(res.Status.Conditions, func(i, j int) bool {
		// some condition types always bubble up
		if res.Status.Conditions[i].Type == "Available" {
			return false
		}

		if res.Status.Conditions[j].Type == "Available" {
			return true
		}

		t1 := res.Status.Conditions[i].LastTransitionTime
		t2 := res.Status.Conditions[j].LastTransitionTime
		return t1.Time.Before(t2.Time)
	})

	return &res, nil
}

func (d *DataLayer) GetResourceYAML(namespace string, def *v1.Carp) (string, error) {
	out, err := d.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "yaml")
	if err != nil {
		return "", err
	}

	return out, nil
}

func (d *DataLayer) DescribeResource(namespace string, kind string, name string) (string, error) {
	out, err := d.runCommandKubectl("describe", strings.ToLower(kind), name, "--namespace", namespace)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (d *DataLayer) ChartUninstall(namespace string, name string) error {
	_, err := d.runCommandHelm("uninstall", name, "--namespace", namespace)
	if err != nil {
		return err
	}
	return nil
}

func (d *DataLayer) Revert(namespace string, name string, rev int) error {
	_, err := d.runCommandHelm("rollback", name, strconv.Itoa(rev), "--namespace", namespace)
	if err != nil {
		return err
	}
	return nil
}

func (d *DataLayer) ChartRepoUpdate(name string) error {
	cmd := []string{"repo", "update"}
	if name != "" {
		cmd = append(cmd, name)
	}

	_, err := d.runCommandHelm(cmd...)
	if err != nil {
		return err
	}

	return nil
}

func (d *DataLayer) ChartInstall(namespace string, name string, repoChart string, version string, justTemplate bool, values string, reuseVals bool) (string, error) {
	if values == "" && reuseVals {
		oldVals, err := d.RevisionValues(namespace, name, 0, true)
		if err != nil {
			return "", err
		}
		values = oldVals
	}

	valsFile, close1, err := utils.TempFile(values)
	defer close1()
	if err != nil {
		return "", err
	}

	cmd := []string{"upgrade", "--install", "--create-namespace", name, repoChart, "--version", version, "--namespace", namespace, "--values", valsFile, "--output", "json"}
	if justTemplate {
		cmd = append(cmd, "--dry-run")
	}

	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return "", err
	}
	res := release.Release{}
	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return "", err
	}
	if justTemplate {
		out = strings.TrimSpace(res.Manifest)
	}

	return out, nil
}

func (d *DataLayer) ShowValues(chart string, ver string) (string, error) {
	return d.runCommandHelm("show", "values", chart, "--version", ver)
}

func (d *DataLayer) ChartRepoList() (res []RepositoryElement, err error) {
	out, err := d.runCommandHelm("repo", "list", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartRepoAdd(name string, url string) (string, error) {
	out, err := d.runCommandHelm("repo", "add", "--force-update", name, url)
	if err != nil {
		return "", err
	}

	return out, nil
}

func (d *DataLayer) ChartRepoDelete(name string) (string, error) {
	out, err := d.runCommandHelm("repo", "remove", name)
	if err != nil {
		return "", err
	}

	return out, nil
}

func RevisionDiff(functor SectionFn, ext string, namespace string, name string, revision1 int, revision2 int, flag bool) (string, error) {
	if revision1 == 0 || revision2 == 0 {
		log.Debugf("One of revisions is zero: %d %d", revision1, revision2)
		return "", nil
	}

	manifest1, err := functor(namespace, name, revision1, flag)
	if err != nil {
		return "", err
	}

	manifest2, err := functor(namespace, name, revision2, flag)
	if err != nil {
		return "", err
	}

	diff := GetDiff(manifest1, manifest2, strconv.Itoa(revision1)+ext, strconv.Itoa(revision2)+ext)
	return diff, nil
}

func GetDiff(text1 string, text2 string, name1 string, name2 string) string {
	edits := myers.ComputeEdits(span.URIFromPath(""), text1, text2)
	unified := gotextdiff.ToUnified(name1, name2, text1, edits)
	diff := fmt.Sprint(unified)
	log.Debugf("The diff is: %s", diff)
	return diff
}
