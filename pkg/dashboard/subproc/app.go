package subproc

import (
	"fmt"
	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/kube"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/release"
	"os"

	// Import to initialize client auth plugins.
	// From https://github.com/kubernetes/client-go/issues/242
	_ "k8s.io/client-go/plugin/pkg/client/auth"
)

// object wrappers for lazy loading
// all in memory, no cache needed

type HelmConfigGetter = func(ctx string, ns string) (*action.Configuration, error)
type HelmNSConfigGetter = func(ns string) (*action.Configuration, error)

type Application struct {
	HelmConfig HelmNSConfigGetter

	K8s                *K8s
	CurrentContextName string
	Scanners           []Scanner

	releases     []*Release
	repositories []*Repository
}

func NewApplication(helmConfig HelmNSConfigGetter) (*Application, error) {
	hc, err := helmConfig("") // TODO: are these the right options?
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client, ok := hc.KubeClient.(*kube.Client)
	if !ok {
		return nil, errors.New("Failed to cast Helm's KubeClient into kube.Client")
	}

	k8s, err := NewK8s(client)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get k8s client")
	}

	return &Application{
		HelmConfig: helmConfig,
		K8s:        k8s,
	}, nil
}

func (a *Application) GetReleases() ([]*Release, error) {
	hc, err := a.HelmConfig("")
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewList(hc)
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

func (a *Application) CheckConnectivity() error {
	hc, err := a.HelmConfig("")
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	err = hc.KubeClient.IsReachable() // TODO: test it on cluster with limited access
	if err != nil {
		return errorx.Decorate(err, "failed to validate k8s cluster connectivity")
	}
	return nil
}

func (a *Application) ReleaseByName(namespace string, name string) (*Release, error) {
	rels, err := a.GetReleases()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}

	for _, r := range rels {
		if r.Orig.Namespace == namespace && r.Orig.Name == name {
			return r, nil
		}
	}

	return nil, errors.New(fmt.Sprintf("release '%s' is not found in namespace '%s'", name, namespace))
}

func NewHelmConfig(ctx string, ns string) (*action.Configuration, error) {
	settings := cli.New()
	settings.KubeContext = ctx
	actionConfig := new(action.Configuration)

	registryClient, err := registry.NewClient(
		registry.ClientOptDebug(false),
		registry.ClientOptEnableCache(true),
		//registry.ClientOptWriter(out),
		registry.ClientOptCredentialsFile(settings.RegistryConfig),
	)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to crete helm config object")
	}
	actionConfig.RegistryClient = registryClient

	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(
		settings.RESTClientGetter(),
		ns,
		helmDriver, log.Debugf); err != nil {
		return nil, errorx.Decorate(err, "failed to init Helm action config")
	}

	return actionConfig, nil
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

type Repository struct {
	// TODO
}
