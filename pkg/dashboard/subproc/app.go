package subproc

import (
	"github.com/joomcode/errorx"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/client-go/tools/clientcmd"
	"os"

	// Import to initialize client auth plugins.
	// From https://github.com/kubernetes/client-go/issues/242
	_ "k8s.io/client-go/plugin/pkg/client/auth"
)

// object wrappers for lazy loading
// all in memory, no cache needed

type Application struct {
	HelmConfig *action.Configuration

	K8s         K8s
	KubeContext string
	Scanners    []Scanner

	releases     []*Release
	repositories []*Repository
}

func NewApplication(helmConfig *action.Configuration) (*Application, *errorx.Error) {
	cfg, err := clientcmd.NewDefaultPathOptions().GetStartingConfig()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get kubectl config")
	}

	return &Application{
		HelmConfig:    helmConfig,
		KubectlConfig: cfg,
	}, nil
}

func (a *Application) GetReleases() ([]*Release, *errorx.Error) {
	client := action.NewList(a.HelmConfig)
	client.All = true
	client.AllNamespaces = true
	client.Limit = 0
	releases, err := client.Run()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}
	a.releases = []*Release{}
	for _, r := range releases {
		a.releases = append(a.releases, &Release{HelmConfig: a.HelmConfig, Orig: r})
	}
	return a.releases, nil
}

func (a *Application) CheckConnectivity() *errorx.Error {
	err := a.HelmConfig.KubeClient.IsReachable()
	if err != nil {
		return errorx.Decorate(err, "failed to validate k8s cluster connectivity")
	}
	return nil
}

func (a *Application) SetContext(ctx string) *errorx.Error {
	x, err := NewHelmConfig(ctx)
	if err != nil {
		return errorx.Decorate(err, "failed to set context to '%s'", ctx)
	}
	a.KubeContext = ctx
	a.HelmConfig = x
	return nil
}

func (a *Application) ReleaseByName(namespace string, name string) (*Release, *errorx.Error) {
	// TODO
	return nil, errorx.DataUnavailable.New("release '%s' is not found in namespace '%s'", name, namespace)
}

func NewHelmConfig(ctx string) (*action.Configuration, *errorx.Error) {
	settings := cli.New()
	settings.KubeContext = ctx
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(
		settings.RESTClientGetter(),
		"", // TODO settings.Namespace()
		helmDriver, log.Debugf); err != nil {
		return nil, errorx.Decorate(err, "failed to init Helm action config")
	}
	return actionConfig, nil
}

type Release struct {
	HelmConfig *action.Configuration
	Orig       *release.Release
	revisions  []*Release
}

func (r *Release) History() ([]*Release, *errorx.Error) {
	client := action.NewHistory(r.HelmConfig)
	// TODO: how to specify namespace?
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

type Repository struct {
	// TODO
}
