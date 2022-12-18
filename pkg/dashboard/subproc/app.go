package subproc

import (
	"github.com/joomcode/errorx"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/registry"
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

	K8s *K8s

	Releases     *Releases
	Repositories *Repositories
}

func NewApplication(helmConfig HelmNSConfigGetter) (*Application, error) {
	hc, err := helmConfig("") // TODO: are these the right options?
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	k8s, err := NewK8s(hc)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get k8s client")
	}

	return &Application{
		HelmConfig: helmConfig,
		K8s:        k8s,
		Releases: &Releases{
			HelmConfig: helmConfig,
		},
		Repositories: &Repositories{
			HelmConfig: helmConfig,
		},
	}, nil
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

func NewHelmConfig(ctx string, ns string) (*action.Configuration, error) {
	// TODO: cache it into map
	// TODO: I feel there should be more elegant way to organize this code
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
