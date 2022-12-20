package subproc

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/hexops/gotextdiff"
	"github.com/hexops/gotextdiff/myers"
	"github.com/hexops/gotextdiff/span"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/client-go/tools/clientcmd"
	"os"
	"strconv"
	"strings"
	"sync"
)

type DataLayer struct {
	KubeContext string
	Helm        string
	Kubectl     string
	Scanners    []Scanner
	StatusInfo  *StatusInfo
	Namespace   string
	Cache       *Cache

	ConfGen         HelmConfigGetter
	appPerContext   map[string]*Application
	appPerContextMx *sync.Mutex
}

type StatusInfo struct {
	CurVer             string
	LatestVer          string
	Analytics          bool
	LimitedToNamespace string
	CacheHitRatio      float64
	ClusterMode        bool
}

func NewDataLayer(ns string, ver string, cg HelmConfigGetter) (*DataLayer, error) {
	return &DataLayer{
		Namespace: ns,
		Cache:     NewCache(),
		StatusInfo: &StatusInfo{
			CurVer:             ver,
			Analytics:          false,
			LimitedToNamespace: ns,
		},

		ConfGen:         cg,
		appPerContext:   map[string]*Application{},
		appPerContextMx: new(sync.Mutex),
	}, nil
}

func (d *DataLayer) runCommand(cmd ...string) (string, error) {
	for i, c := range cmd {
		// TODO: remove namespace parameter if it's empty
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

func (d *DataLayer) forceNamespace(s *string) {
	if d.Namespace != "" {
		*s = d.Namespace
	}
}

func (d *DataLayer) ListContexts() ([]KubeContext, error) {
	res := []KubeContext{}

	if os.Getenv("HD_CLUSTER_MODE") != "" {
		return res, nil
	}

	cfg, err := clientcmd.NewDefaultPathOptions().GetStartingConfig()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get kubectl config")
	}

	for name, ctx := range cfg.Contexts {
		res = append(res, KubeContext{
			IsCurrent: cfg.CurrentContext == name,
			Name:      name,
			Cluster:   ctx.Cluster,
			AuthInfo:  ctx.AuthInfo,
			Namespace: ctx.Namespace,
		})
	}

	return res, nil
}

func (d *DataLayer) CheckConnectivity() error {
	contexts, err := d.ListContexts()
	if err != nil {
		return err
	}

	if len(contexts) < 1 {
		log.Debugf("Did not find any contexts, will try checking k8s")
		app, err := d.AppForCtx("")
		if err != nil {
			return errors.New("did not find any kubectl contexts configured")
		}

		err = app.K8s.KubectlClient.IsReachable()
		if err != nil {
			return errorx.Decorate(err, "failed to access k8s cluster")
		}

		log.Infof("Assuming k8s environment")
		d.StatusInfo.ClusterMode = true
	}

	return nil
}

func (d *DataLayer) GetStatus() *StatusInfo {
	sum := float64(d.Cache.HitCount + d.Cache.MissCount)
	if sum > 0 {
		d.StatusInfo.CacheHitRatio = float64(d.Cache.HitCount) / sum
	} else {
		d.StatusInfo.CacheHitRatio = 0
	}
	return d.StatusInfo
}

type SectionFn = func(*release.Release, bool) (string, error)

func (d *DataLayer) RevisionManifests(namespace string, chartName string, revision int, _ bool) (res string, err error) {
	cmd := []string{"get", "manifest", chartName, "--namespace", namespace, "--revision", strconv.Itoa(revision)}

	key := CacheKeyRevManifests + "\v" + namespace + "\v" + chartName + "\v" + strconv.Itoa(revision)
	return d.Cache.String(key, nil, func() (string, error) {
		return d.runCommandHelm(cmd...)
	})
}

func ParseManifests(out string) ([]*v1.Carp, error) {
	dec := yaml.NewDecoder(bytes.NewReader([]byte(out)))

	res := make([]*v1.Carp, 0)
	var tmp interface{}
	for dec.Decode(&tmp) == nil {
		// k8s libs uses only JSON tags defined, say hello to https://github.com/go-yaml/yaml/issues/424
		// we can juggle it
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

func (d *DataLayer) RevisionValues(namespace string, chartName string, revision int, onlyUserDefined bool) (res string, err error) {
	cmd := []string{"get", "values", chartName, "--namespace", namespace, "--output", "yaml", "--revision", strconv.Itoa(revision)}

	if !onlyUserDefined {
		cmd = append(cmd, "--all")
	}

	key := CacheKeyRevValues + "\v" + namespace + "\v" + chartName + "\v" + strconv.Itoa(revision) + "\v" + fmt.Sprintf("%v", onlyUserDefined)
	return d.Cache.String(key, nil, func() (string, error) {
		return d.runCommandHelm(cmd...)
	})
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

	if !justTemplate {
		d.Cache.Invalidate(CacheKeyRelList, cacheTagRelease(namespace, name))
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

func (d *DataLayer) SetContext(ctx string) error {
	if d.KubeContext != ctx {
		err := d.Cache.Clear()
		if err != nil {
			return errors.Wrap(err, "failed to set context")
		}
	}

	d.KubeContext = ctx

	return nil
}

func (d *DataLayer) AppForCtx(ctx string) (*Application, error) {
	d.appPerContextMx.Lock()
	defer d.appPerContextMx.Unlock()

	app, ok := d.appPerContext[ctx]
	if !ok {
		settings := cli.New()
		settings.KubeContext = ctx

		cfgGetter := func(ns string) (*action.Configuration, error) {
			return d.ConfGen(settings, ns)
		}

		a, err := NewApplication(settings, cfgGetter)
		if err != nil {
			return nil, errorx.Decorate(err, "Failed to create application for context '%s'", ctx)
		}

		app = a
		d.appPerContext[ctx] = app
	}
	return app, nil
}

func RevisionDiff(functor SectionFn, ext string, revision1 *release.Release, revision2 *release.Release, flag bool) (string, error) {
	if revision1 == nil || revision2 == nil {
		log.Debugf("One of revisions is nil: %d %d", revision1, revision2)
		return "", nil
	}

	manifest1, err := functor(revision1, flag)
	if err != nil {
		return "", err
	}

	manifest2, err := functor(revision2, flag)
	if err != nil {
		return "", err
	}

	diff := GetDiff(manifest1, manifest2, strconv.Itoa(revision1.Version)+ext, strconv.Itoa(revision2.Version)+ext)
	return diff, nil
}

func GetDiff(text1 string, text2 string, name1 string, name2 string) string {
	edits := myers.ComputeEdits(span.URIFromPath(""), text1, text2)
	unified := gotextdiff.ToUnified(name1, name2, text1, edits)
	diff := fmt.Sprint(unified)
	log.Debugf("The diff is: %s", diff)
	return diff
}
