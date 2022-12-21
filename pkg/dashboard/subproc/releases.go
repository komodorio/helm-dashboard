package subproc

import (
	"fmt"
	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/downloader"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/release"
	"io/ioutil"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"strings"
)

type Releases struct {
	HelmConfig HelmNSConfigGetter
	Settings   *cli.EnvSettings
}

func (a *Releases) List() ([]*Release, error) {
	hc, err := a.HelmConfig("") // TODO: empty ns?
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewList(hc)
	client.All = true
	client.AllNamespaces = true
	client.Limit = 0
	rels, err := client.Run()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}
	releases := []*Release{}
	for _, r := range rels {
		releases = append(releases, &Release{HelmConfig: a.HelmConfig, Orig: r})
	}
	return releases, nil
}

func (a *Releases) ByName(namespace string, name string) (*Release, error) {
	rels, err := a.List()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}

	for _, r := range rels {
		if r.Orig.Namespace == namespace && r.Orig.Name == name {
			return r, nil
		}
	}

	return nil, errorx.DataUnavailable.New(fmt.Sprintf("release '%s' is not found in namespace '%s'", name, namespace))
}

func (a *Releases) Install(namespace string, name string, repoChart string, version string, justTemplate bool, values map[string]interface{}) (string, error) {
	hc, err := a.HelmConfig(a.Settings.Namespace())
	if err != nil {
		return "", errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	cmd := action.NewInstall(hc)

	if namespace == "" {
		namespace = a.Settings.Namespace()
	}

	cmd.ReleaseName = name
	cmd.CreateNamespace = true
	cmd.Namespace = namespace
	cmd.Version = version

	if justTemplate {
		cmd.DryRun = true
	}

	chrt, err := a.locateChart(cmd, repoChart)
	if err != nil {
		return "", err
	}

	res, err := cmd.Run(chrt, values)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(res.Manifest), nil
}

func (a *Releases) locateChart(client *action.Install, chart string) (*chart.Chart, error) {
	// from cmd/helm/install.go and cmd/helm/upgrade.go
	cp, err := client.ChartPathOptions.LocateChart(chart, a.Settings)
	if err != nil {
		return nil, err
	}

	log.Debugf("Located chart %s: %s\n", chart, cp)

	p := getter.All(a.Settings)

	// Check chart dependencies to make sure all are present in /charts
	chartRequested, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	if err := checkIfInstallable(chartRequested); err != nil {
		return nil, err
	}

	if req := chartRequested.Metadata.Dependencies; req != nil {
		// If CheckDependencies returns an error, we have unfulfilled dependencies.
		// As of Helm 2.4.0, this is treated as a stopping condition:
		// https://github.com/helm/helm/issues/2209
		if err := action.CheckDependencies(chartRequested, req); err != nil {
			err = errorx.Decorate(err, "An error occurred while checking for chart dependencies. You may need to run `helm dependency build` to fetch missing dependencies")
			if client.DependencyUpdate {
				man := &downloader.Manager{
					Out:              ioutil.Discard,
					ChartPath:        cp,
					Keyring:          client.ChartPathOptions.Keyring,
					SkipUpdate:       false,
					Getters:          p,
					RepositoryConfig: a.Settings.RepositoryConfig,
					RepositoryCache:  a.Settings.RepositoryCache,
					Debug:            a.Settings.Debug,
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
	HelmConfig HelmNSConfigGetter
	Orig       *release.Release
	revisions  []*Release
}

func (r *Release) History() ([]*Release, error) {
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
		r.revisions = append(r.revisions, &Release{HelmConfig: r.HelmConfig, Orig: rev})
	}

	return r.revisions, nil
}

func (r *Release) Uninstall() error {
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
	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewRollback(hc)
	client.Version = toRevision
	return client.Run(r.Orig.Name)
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
	hist, err := r.History()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get history")
	}

	for _, rev := range hist {
		if rev.Orig.Version == revNo {
			return rev, nil
		}
	}

	return nil, errorx.InternalError.New("No revision found for number %s", revNo)
}

func checkIfInstallable(ch *chart.Chart) error {
	switch ch.Metadata.Type {
	case "", "application":
		return nil
	}
	return errors.Errorf("%s charts are not installable", ch.Metadata.Type)
}
