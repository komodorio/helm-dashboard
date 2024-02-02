package objects

import (
	"bytes"
	"io"
	"os"
	"path"
	"sync"

	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/downloader"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

type Releases struct {
	Namespaces []string
	HelmConfig HelmNSConfigGetter
	Settings   *cli.EnvSettings
	mx         sync.Mutex
}

func (a *Releases) List() ([]*Release, error) {
	a.mx.Lock()
	defer a.mx.Unlock()

	releases := []*Release{}
	for _, ns := range a.Namespaces {
		log.Debugf("Listing releases in namespace: %s", ns)
		hc, err := a.HelmConfig(ns)
		if err != nil {
			return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
		}

		client := action.NewList(hc)
		client.All = true
		client.AllNamespaces = true
		client.Limit = 0
		client.SetStateMask() // required to apply proper filtering
		rels, err := client.Run()
		if err != nil {
			return nil, errorx.Decorate(err, "failed to get list of releases")
		}
		for _, r := range rels {
			releases = append(releases, NewRelease(a.HelmConfig, r, a.Settings))
		}
	}
	return releases, nil
}

func (a *Releases) ByName(namespace string, name string) (*Release, error) {
	log.Debugf("Getting release by ns+name: %s/%s", namespace, name)
	hc, err := a.HelmConfig(namespace)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewGet(hc)
	rel, err := client.Run(name)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm release")
	}

	return NewRelease(a.HelmConfig, rel, a.Settings), nil
}

func (a *Releases) Install(namespace string, name string, repoChart string, version string, justTemplate bool, values map[string]interface{}) (*release.Release, error) {
	a.mx.Lock()
	defer a.mx.Unlock()

	if namespace == "" {
		namespace = a.Settings.Namespace()
	}

	hc, err := a.HelmConfig(namespace)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	cmd := action.NewInstall(hc)

	cmd.ReleaseName = name
	cmd.CreateNamespace = true
	cmd.Namespace = namespace
	cmd.Version = version

	cmd.DryRun = justTemplate
	if cmd.DryRun {
		cmd.DryRunOption = "server"
	}

	chrt, err := locateChart(cmd.ChartPathOptions, repoChart, a.Settings)
	if err != nil {
		return nil, err
	}

	res, err := cmd.Run(chrt, values)
	if err != nil {
		return nil, err
	}

	if !justTemplate {
		log.Infof("Installed new release: %s/%s", namespace, name)
	}

	return res, nil
}

func locateChart(pathOpts action.ChartPathOptions, chart string, settings *cli.EnvSettings) (*chart.Chart, error) {
	// from cmd/helm/install.go and cmd/helm/upgrade.go
	cp, err := pathOpts.LocateChart(chart, settings)
	if err != nil {
		return nil, err
	}

	log.Debugf("Located chart %s: %s\n", chart, cp)

	p := getter.All(settings)

	// Check chart dependencies to make sure all are present in /charts
	chartRequested, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	if err := checkIfInstallable(chartRequested); err != nil {
		return nil, err
	}

	registryClient, err := registry.NewClient(
		registry.ClientOptDebug(false),
		registry.ClientOptEnableCache(true),
		//registry.ClientOptWriter(out),
		registry.ClientOptCredentialsFile(settings.RegistryConfig),
	)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to crete helm config object")
	}

	if req := chartRequested.Metadata.Dependencies; req != nil {
		// If CheckDependencies returns an error, we have unfulfilled dependencies.
		// As of Helm 2.4.0, this is treated as a stopping condition:
		// https://github.com/helm/helm/issues/2209
		if err := action.CheckDependencies(chartRequested, req); err != nil {
			err = errorx.Decorate(err, "An error occurred while checking for chart dependencies. You may need to run `helm dependency build` to fetch missing dependencies")
			if true { // client.DependencyUpdate
				man := &downloader.Manager{
					Out:              io.Discard,
					ChartPath:        cp,
					Keyring:          pathOpts.Keyring,
					SkipUpdate:       false,
					Getters:          p,
					RepositoryConfig: settings.RepositoryConfig,
					RepositoryCache:  settings.RepositoryCache,
					Debug:            settings.Debug,
					RegistryClient:   registryClient, // added on top of Helm code
				}
				if err := man.Update(); err != nil {
					return nil, err
				}
				// Reload the chart with the updated Chart.lock file.
				if chartRequested, err = loader.Load(cp); err != nil {
					return nil, errorx.Decorate(err, "failed reloading chart after repo update")
				}
			} else {
				return nil, err
			}
		}
	}

	return chartRequested, nil
}

type Release struct {
	Settings          *cli.EnvSettings
	HelmConfig        HelmNSConfigGetter
	Orig              *release.Release
	revisions         []*Release
	mx                sync.Mutex
	restoredChartPath string
}

func (r *Release) History() ([]*Release, error) {
	r.mx.Lock()
	defer r.mx.Unlock()

	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewHistory(hc)
	revs, err := client.Run(r.Orig.Name)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get revisions of release")
	}

	r.revisions = []*Release{}
	for _, rev := range revs {
		r.revisions = append(r.revisions, NewRelease(r.HelmConfig, rev, r.Settings))
	}

	return r.revisions, nil
}

func (r *Release) Uninstall() error {
	r.mx.Lock()
	defer r.mx.Unlock()

	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewUninstall(hc)
	_, err = client.Run(r.Orig.Name)
	if err != nil {
		return errorx.Decorate(err, "failed to uninstall release")
	}
	return nil
}

func (r *Release) Rollback(toRevision int) error {
	r.mx.Lock()
	defer r.mx.Unlock()

	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewRollback(hc)
	client.Version = toRevision
	err = client.Run(r.Orig.Name)
	if err != nil {
		return errorx.Decorate(err, "failed to rollback the release")
	}
	log.Infof("Rolled back %s/%s to %d=>%d", r.Orig.Namespace, r.Orig.Name, r.Orig.Version, toRevision)
	return nil
}

func (r *Release) RunTests() (string, error) {
	r.mx.Lock()
	defer r.mx.Unlock()

	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return "", errorx.Decorate(err, "failed to get helm config for namespace '%s'", r.Orig.Namespace)
	}

	client := action.NewReleaseTesting(hc)
	client.Namespace = r.Orig.Namespace

	rel, err := client.Run(r.Orig.Name)
	if err != nil {
		return "", errorx.Decorate(err, "failed to execute 'helm test' for release '%s'", r.Orig.Name)
	}

	var buf bytes.Buffer
	if err := client.GetPodLogs(&buf, rel); err != nil {
		return "", errorx.Decorate(err, "failed to fetch logs for 'helm test' command")
	}
	return buf.String(), nil
}

func (r *Release) ParsedManifests() ([]*v1.Carp, error) {
	carps, err := ParseManifests(r.Orig.Manifest)
	if err != nil {
		return nil, err
	}

	for _, carp := range carps {
		if carp.Namespace == "" {
			carp.Namespace = r.Orig.Namespace
		}
	}

	return carps, err
}

func (r *Release) GetRev(revNo int) (*Release, error) {
	if revNo == 0 {
		revNo = r.Orig.Version
	}

	hist, err := r.History()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get history")
	}

	for _, rev := range hist {
		if rev.Orig.Version == revNo {
			return rev, nil
		}
	}

	return nil, errorx.InternalError.New("No revision found for number %d", revNo)
}

func (r *Release) Upgrade(repoChart string, version string, justTemplate bool, values map[string]interface{}) (*release.Release, error) {
	r.mx.Lock()
	defer r.mx.Unlock()

	// if repo chart is not passed, let's try to restore it from secret
	if repoChart == "" {
		var err error
		repoChart, err = r.restoreChart()
		if err != nil {
			return nil, errorx.Decorate(err, "failed to revive chart for release")
		}
	}

	ns := r.Settings.Namespace()
	if r.Orig != nil {
		ns = r.Orig.Namespace
	}

	hc, err := r.HelmConfig(ns)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", ns)
	}

	cmd := action.NewUpgrade(hc)
	cmd.MaxHistory = r.Settings.MaxHistory

	cmd.Namespace = r.Settings.Namespace()
	cmd.Version = version

	cmd.DryRun = justTemplate
	if cmd.DryRun {
		cmd.DryRunOption = "server"
	}
	cmd.ResetValues = true

	chrt, err := locateChart(cmd.ChartPathOptions, repoChart, r.Settings)
	if err != nil {
		return nil, err
	}

	res, err := cmd.Run(r.Orig.Name, chrt, values)
	if err != nil {
		return nil, err
	}

	if !justTemplate {
		log.Infof("Upgraded release: %s/%s#%d", res.Namespace, res.Name, res.Version)
	}

	return res, nil
}

func (r *Release) restoreChart() (string, error) {
	if r.restoredChartPath != "" {
		return r.restoredChartPath, nil
	}

	// we're unlikely to have the original chart, let's try the cheesy thing...

	log.Infof("Attempting to restore the chart for %s", r.Orig.Name)
	dir, err := os.MkdirTemp("", "khd-*")
	if err != nil {
		return "", errorx.Decorate(err, "failed to get temporary directory")
	}

	//restore Chart.yaml
	cdata, err := yaml.Marshal(r.Orig.Chart.Metadata)
	if err != nil {
		return "", errorx.Decorate(err, "failed to restore Chart.yaml")
	}
	err = os.WriteFile(path.Join(dir, "Chart.yaml"), cdata, 0644)
	if err != nil {
		return "", errorx.Decorate(err, "failed to write file Chart.yaml")
	}

	//restore known values
	vdata, err := yaml.Marshal(r.Orig.Chart.Values)
	if err != nil {
		return "", errorx.Decorate(err, "failed to restore values.yaml")
	}
	err = os.WriteFile(path.Join(dir, "values.yaml"), vdata, 0644)
	if err != nil {
		return "", errorx.Decorate(err, "failed to write file values.yaml")
	}

	// if possible, overwrite files with better alternatives
	for _, f := range append(r.Orig.Chart.Raw, r.Orig.Chart.Templates...) {
		fname := path.Join(dir, f.Name)
		log.Debugf("Restoring file: %s", fname)
		err := os.MkdirAll(path.Dir(fname), 0755)
		if err != nil {
			return "", errorx.Decorate(err, "failed to create directory for file: %s", fname)
		}

		err = os.WriteFile(fname, f.Data, 0644)
		if err != nil {
			return "", errorx.Decorate(err, "failed to write file to restore chart: %s", fname)
		}
	}

	r.restoredChartPath = dir

	return dir, nil
}

func checkIfInstallable(ch *chart.Chart) error {
	switch ch.Metadata.Type {
	case "", "application":
		return nil
	}
	return errors.Errorf("%s charts are not installable", ch.Metadata.Type)
}

func NewRelease(hc HelmNSConfigGetter, orig *release.Release, settings *cli.EnvSettings) *Release {
	return &Release{
		HelmConfig: hc,
		Orig:       orig,
		Settings:   settings,
	}
}
