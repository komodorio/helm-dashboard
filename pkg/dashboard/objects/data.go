package objects

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"io"

	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/v2/pkg/dashboard/utils"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/tools/clientcmd"
	//"sigs.k8s.io/yaml"
)

type DataLayer struct {
	KubeContext string
	StatusInfo  *StatusInfo
	Namespaces  []string
	Cache       *Cache

	ConfGen         HelmConfigGetter
	appPerContext   map[string]*Application
	appPerContextMx *sync.Mutex
	devel           bool
	LocalCharts     []string
}

type StatusInfo struct {
	CurVer        string
	LatestVer     string
	Analytics     bool
	CacheHitRatio float64
	ClusterMode   bool
	NoHealth      bool
	NoLatest      bool
}

func NewDataLayer(ns []string, ver string, cg HelmConfigGetter, devel bool) (*DataLayer, error) {
	if cg == nil {
		return nil, errors.New("HelmConfigGetter can't be nil")
	}

	return &DataLayer{
		Namespaces: ns,
		Cache:      NewCache(),
		StatusInfo: &StatusInfo{
			CurVer:    ver,
			Analytics: false,
		},

		ConfGen:         cg,
		appPerContext:   map[string]*Application{},
		appPerContextMx: new(sync.Mutex),
		devel:           devel,
	}, nil
}

func (d *DataLayer) ListContexts() ([]KubeContext, error) {
	res := []KubeContext{}

	if d.StatusInfo.ClusterMode {
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

func ParseManifests(out string) ([]*v1.Carp, error) {
	dec := yaml.NewYAMLOrJSONDecoder(strings.NewReader(out), 4096)
	res := make([]*v1.Carp, 0)
	var tmp interface{}
	for {
		err := dec.Decode(&tmp)
		if err == io.EOF {
			break
		}

		if err != nil {
			return res, errorx.Decorate(err, "failed to parse manifest document #%d", len(res)+1)
		}

		// k8s libs uses only JSON tags defined, say hello to https://github.com/go-yaml/yaml/issues/424
		// we can juggle it
		jsoned, err := json.Marshal(tmp)
		if err != nil {
			return res, err
		}

		var doc v1.Carp
		err = json.Unmarshal(jsoned, &doc)
		if err != nil {
			return res, err
		}

		if doc.Kind == "" {
			log.Warnf("Manifest piece is not k8s resource: %s", jsoned)
			continue
		}

		res = append(res, &doc)
	}
	return res, nil
}

// ContainerImage represents a container image found in a release manifest.
type ContainerImage struct {
	Resource string `json:"resource"`
	Kind     string `json:"kind"`
	Container string `json:"container"`
	Image    string `json:"image"`
}

// ExtractImages parses a manifest and returns all container images found.
func ExtractImages(manifest string) []ContainerImage {
	dec := yaml.NewYAMLOrJSONDecoder(strings.NewReader(manifest), 4096)
	var images []ContainerImage
	for {
		var tmp map[string]interface{}
		if err := dec.Decode(&tmp); err != nil {
			break
		}
		kind, _ := tmp["kind"].(string)
		metadata, _ := tmp["metadata"].(map[string]interface{})
		name, _ := metadata["name"].(string)

		for _, podSpec := range findPodSpecs(kind, tmp) {
			containers, _ := podSpec["containers"].([]interface{})
			images = extractFromContainers(images, kind, name, containers)
			initContainers, _ := podSpec["initContainers"].([]interface{})
			images = extractFromContainers(images, kind, name, initContainers)
		}
	}
	return images
}

func extractFromContainers(images []ContainerImage, kind, resource string, containers []interface{}) []ContainerImage {
	for _, c := range containers {
		cMap, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		img, _ := cMap["image"].(string)
		cName, _ := cMap["name"].(string)
		if img != "" {
			images = append(images, ContainerImage{
				Resource:  resource,
				Kind:      kind,
				Container: cName,
				Image:     img,
			})
		}
	}
	return images
}

// findPodSpecs returns the pod spec(s) from a resource, depending on kind.
func findPodSpecs(kind string, obj map[string]interface{}) []map[string]interface{} {
	spec, _ := obj["spec"].(map[string]interface{})
	if spec == nil {
		return nil
	}
	switch kind {
	case "Pod":
		return []map[string]interface{}{spec}
	case "Deployment", "StatefulSet", "DaemonSet", "ReplicaSet", "Job":
		tpl, _ := spec["template"].(map[string]interface{})
		if ps, ok := tpl["spec"].(map[string]interface{}); ok {
			return []map[string]interface{}{ps}
		}
	case "CronJob":
		jobTpl, _ := spec["jobTemplate"].(map[string]interface{})
		jobSpec, _ := jobTpl["spec"].(map[string]interface{})
		tpl, _ := jobSpec["template"].(map[string]interface{})
		if ps, ok := tpl["spec"].(map[string]interface{}); ok {
			return []map[string]interface{}{ps}
		}
	}
	return nil
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

		settings.SetNamespace(d.nsForCtx(ctx))

		cfgGetter := func(ns string) (*action.Configuration, error) {
			return d.ConfGen(settings, ns)
		}

		a, err := NewApplication(settings, cfgGetter, d.Namespaces, d.devel)
		if err != nil {
			return nil, errorx.Decorate(err, "Failed to create application for context '%s'", ctx)
		}

		a.Repositories.LocalCharts = d.LocalCharts

		app = a
		d.appPerContext[ctx] = app
	}
	return app, nil
}

func (d *DataLayer) nsForCtx(ctx string) string {
	lst, err := d.ListContexts()
	if err != nil {
		log.Debugf("Failed to get contexts for NS lookup: %+v", err)
	}
	for _, c := range lst {
		if c.Name == ctx {
			return c.Namespace
		}
	}
	log.Debugf("Strange: no context found for '%s'", ctx)
	return ""
}

func (d *DataLayer) PeriodicTasks(ctx context.Context) {
	if !utils.EnvAsBool("HD_NO_AUTOUPDATE", false) {
		// auto-update repos
		go d.loopUpdateRepos(ctx, 10*time.Minute) // TODO: parameterize interval?
	}
}

func (d *DataLayer) loopUpdateRepos(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	for {
		app, err := d.AppForCtx("")
		if err != nil {
			log.Warnf("Failed to get app object while in background repo update: %v", err)
			break // no point in retrying
		} else {
			repos, err := app.Repositories.List()
			if err != nil {
				log.Warnf("Failed to get list of repos while in background update: %v", err)
			}

			for _, repo := range repos {
				err := repo.Update()
				if err != nil {
					log.Warnf("Failed to update repo %s: %v", repo.Name(), err)
				}
			}
		}

		select {
		case <-ctx.Done():
			ticker.Stop()
			return
		case <-ticker.C:
			continue
		}
	}
	log.Debugf("Update repo loop done.")
}
