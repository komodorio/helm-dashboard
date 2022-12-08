package subproc

import (
	"fmt"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/kube"
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

	K8s         *K8s
	KubeContext string
	Scanners    []Scanner

	releases     []*Release
	repositories []*Repository
}

func NewApplication(helmConfig *action.Configuration) (*Application, error) {
	cfg, err := clientcmd.NewDefaultPathOptions().GetStartingConfig()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get kubectl config")
	}

	client, ok := helmConfig.KubeClient.(interface{}).(kube.Client)
	if !ok {
		return nil, errors.New("Failed to cast Helm's KubeClient into kube.Client")
	}

	return &Application{
		HelmConfig: helmConfig,
		K8s:        &K8s{KubectlConfig: cfg, KubectlClient: client},
	}, nil
}

func (a *Application) GetReleases() ([]*Release, error) {
	client := action.NewList(a.HelmConfig)
	client.All = true
	client.AllNamespaces = true
	client.Limit = 0
	releases, err := client.Run()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get list of releases")
	}
	a.releases = []*Release{}
	for _, r := range releases {
		a.releases = append(a.releases, &Release{HelmConfig: a.HelmConfig, Orig: r})
	}
	return a.releases, nil
}

func (a *Application) CheckConnectivity() error {
	err := a.HelmConfig.KubeClient.IsReachable()
	if err != nil {
		return errors.Wrap(err, "failed to validate k8s cluster connectivity")
	}
	return nil
}

func (a *Application) SetContext(ctx string) error {
	x, err := NewHelmConfig(ctx)
	if err != nil {
		return errors.Wrapf(err, "failed to set context to '%s'", ctx)
	}
	a.KubeContext = ctx
	a.HelmConfig = x
	return nil
}

func (a *Application) ReleaseByName(namespace string, name string) (*Release, error) {
	// TODO
	return nil, errors.New(fmt.Sprintf("release '%s' is not found in namespace '%s'", name, namespace))
}

func NewHelmConfig(ctx string) (*action.Configuration, error) {
	settings := cli.New()
	settings.KubeContext = ctx
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(
		settings.RESTClientGetter(),
		"", // TODO settings.Namespace()
		helmDriver, log.Debugf); err != nil {
		return nil, errors.Wrap(err, "failed to init Helm action config")
	}
	return actionConfig, nil
}

type Release struct {
	HelmConfig *action.Configuration
	Orig       *release.Release
	revisions  []*Release
}

func (r *Release) History() ([]*Release, error) {
	client := action.NewHistory(r.HelmConfig)
	// TODO: how to specify namespace?
	revs, err := client.Run(r.Orig.Name)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get revisions of release")
	}

	r.revisions = []*Release{}
	for _, rev := range revs {
		r.revisions = append(r.revisions, &Release{HelmConfig: r.HelmConfig, Orig: rev})
	}

	return r.revisions, nil
}

func (r *Release) Uninstall() error {
	client := action.NewUninstall(r.HelmConfig)
	run, err := client.Run(r.Orig.Name)
	// TODO: how to set namespace?
	if err != nil {
		return nil, errors.Wrap(err, "failed to uninstall release")
	}
}

func (r *Release) Rollback(toRevision int) error {

}

type Repository struct {
	// TODO
}
