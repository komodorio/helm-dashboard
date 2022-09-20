package dashboard

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/Masterminds/semver/v3"
	"github.com/hexops/gotextdiff"
	"github.com/hexops/gotextdiff/myers"
	"github.com/hexops/gotextdiff/span"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"io/ioutil"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"os"
	"os/exec"
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
}

func (d *DataLayer) runCommand(cmd ...string) (string, error) {
	log.Debugf("Starting command: %s", cmd)
	prog := exec.Command(cmd[0], cmd[1:]...)
	prog.Env = os.Environ()
	prog.Env = append(prog.Env, "HELM_KUBECONTEXT="+d.KubeContext)

	var stdout bytes.Buffer
	prog.Stdout = &stdout

	var stderr bytes.Buffer
	prog.Stderr = &stderr

	if err := prog.Run(); err != nil {
		log.Warnf("Failed command: %s", cmd)
		serr := stderr.Bytes()
		if serr != nil {
			log.Warnf("STDERR:\n%s", serr)
		}
		if eerr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("failed to run command %s:\nError: %s\nSTDERR:%s", cmd, eerr, serr)
		}
		return "", err
	}

	sout := stdout.Bytes()
	serr := stderr.Bytes()
	log.Debugf("Command STDOUT:\n%s", sout)
	log.Debugf("Command STDERR:\n%s", serr)
	return string(sout), nil
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
	// TODO: migrate into using kubectl "k8s.io/kubectl/pkg/cmd" and kube API
	if d.Kubectl == "" {
		d.Kubectl = "kubectl"
	}

	cmd = append([]string{d.Kubectl}, cmd...)

	if d.KubeContext != "" {
		cmd = append(cmd, "--context", d.KubeContext)
	}

	return d.runCommand(cmd...)
}

func (d *DataLayer) CheckConnectivity() error {
	contexts, err := d.ListContexts()
	if err != nil {
		return err
	}

	if len(contexts) < 1 {
		return errors.New("did not find any kubectl contexts configured")
	}

	/*
		_, err = d.runCommandHelm("env") // no point in doing is, since the default context may be invalid
		if err != nil {
			return err
		}
	*/

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

func (d *DataLayer) ListInstalled() (res []releaseElement, err error) {
	out, err := d.runCommandHelm("ls", "--all", "--all-namespaces", "--output", "json", "--time-format", time.RFC3339)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartHistory(namespace string, chartName string) (res []*historyElement, err error) {
	// TODO: there is `max` but there is no `offset`
	out, err := d.runCommandHelm("history", chartName, "--namespace", namespace, "--output", "json", "--max", "18")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	var aprev *semver.Version
	var cprev *semver.Version
	for _, elm := range res {
		chartRepoName, curVer, err := chartAndVersion(elm.Chart)
		if err != nil {
			return nil, err
		}
		elm.ChartName = chartRepoName
		elm.ChartVer = curVer
		elm.Action = ""
		elm.Updated.Time = elm.Updated.Time.Round(time.Second)

		cver, err1 := semver.NewVersion(elm.ChartVer)
		aver, err2 := semver.NewVersion(elm.AppVersion)
		if err1 == nil && err2 == nil {
			if aprev != nil && cprev != nil {
				switch {
				case aprev.LessThan(aver):
					elm.Action = "app_upgrade"
				case aprev.GreaterThan(aver):
					elm.Action = "app_downgrade"
				case cprev.LessThan(cver):
					elm.Action = "chart_upgrade"
				case cprev.GreaterThan(cver):
					elm.Action = "chart_downgrade"
				default:
					elm.Action = "reconfigure"
				}
			}
		} else {
			log.Debugf("Semver parsing errors: %s=%s, %s=%s", elm.ChartVer, err1, elm.AppVersion, err2)
		}

		aprev = aver
		cprev = cver
	}

	return res, nil
}

func (d *DataLayer) ChartRepoVersions(chartName string) (res []repoChartElement, err error) {
	cmd := []string{"search", "repo", "--regexp", "/" + chartName + "\v", "--versions", "--output", "json"}
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

func (d *DataLayer) RevisionManifestsParsed(namespace string, chartName string, revision int) ([]*GenericResource, error) {
	out, err := d.RevisionManifests(namespace, chartName, revision, false)
	if err != nil {
		return nil, err
	}

	dec := yaml.NewDecoder(bytes.NewReader([]byte(out)))

	res := make([]*GenericResource, 0)
	var tmp interface{}
	for dec.Decode(&tmp) == nil {
		// k8s libs uses only JSON tags defined, say hello to https://github.com/go-yaml/yaml/issues/424
		// bug we can juggle it
		jsoned, err := json.Marshal(tmp)
		if err != nil {
			return nil, err
		}

		var doc GenericResource
		err = json.Unmarshal(jsoned, &doc)
		if err != nil {
			return nil, err
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

func (d *DataLayer) GetResource(namespace string, def *GenericResource) (*GenericResource, error) {
	out, err := d.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "json")
	if err != nil {
		if strings.HasSuffix(strings.TrimSpace(err.Error()), " not found") {
			return &GenericResource{
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

	var res GenericResource
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

func (d *DataLayer) DescribeResource(namespace string, kind string, name string) (string, error) {
	out, err := d.runCommandKubectl("describe", strings.ToLower(kind), name, "--namespace", namespace)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (d *DataLayer) UninstallChart(namespace string, name string) error {
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

func (d *DataLayer) ChartUpgrade(namespace string, name string, repoChart string, version string, justTemplate bool) (string, error) {
	oldVals, err := d.RevisionValues(namespace, name, 0, false)
	if err != nil {
		return "", err
	}

	file, err := ioutil.TempFile("", "helm_vals_")
	if err != nil {
		return "", err
	}
	defer os.Remove(file.Name())

	err = ioutil.WriteFile(file.Name(), []byte(oldVals), 0600)
	if err != nil {
		return "", err
	}

	cmd := []string{name, repoChart, "--version", version, "--namespace", namespace, "--values", file.Name()}
	if justTemplate {
		cmd = append([]string{"template", "--skip-tests"}, cmd...)
	} else {
		cmd = append([]string{"upgrade"}, cmd...)
		cmd = append(cmd, "--output", "json")
	}

	out, err := d.runCommandHelm(cmd...)
	if err != nil {
		return "", err
	}

	if justTemplate {
		manifests, err := d.RevisionManifests(namespace, name, 0, false)
		if err != nil {
			return "", err
		}
		out = getDiff(strings.TrimSpace(manifests), strings.TrimSpace(out), "current.yaml", "upgraded.yaml")
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

	diff := getDiff(manifest1, manifest2, strconv.Itoa(revision1)+ext, strconv.Itoa(revision2)+ext)
	return diff, nil
}

func getDiff(text1 string, text2 string, name1 string, name2 string) string {
	edits := myers.ComputeEdits(span.URIFromPath(""), text1, text2)
	unified := gotextdiff.ToUnified(name1, name2, text1, edits)
	diff := fmt.Sprint(unified)
	log.Debugf("The diff is: %s", diff)
	return diff
}

type GenericResource = v1.Carp
