package objects

import (
	"github.com/joomcode/errorx"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"

	// Import to initialize client auth plugins.
	// From https://github.com/kubernetes/client-go/issues/242
	_ "k8s.io/client-go/plugin/pkg/client/auth"
)

type HelmConfigGetter = func(sett *cli.EnvSettings, ns string) (*action.Configuration, error)
type HelmNSConfigGetter = func(ns string) (*action.Configuration, error)

type Application struct {
	Settings   *cli.EnvSettings
	HelmConfig HelmNSConfigGetter

	K8s *K8s

	Releases     *Releases
	Repositories *Repositories
}

func NewApplication(settings *cli.EnvSettings, helmConfig HelmNSConfigGetter, namespaces []string, devel bool) (*Application, error) {
	hc, err := helmConfig(settings.Namespace())
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	k8s, err := NewK8s(hc, namespaces)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get k8s client")
	}

	semVerConstraint, err := versionConstaint(devel)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to create semantic version constraint")
	}

	return &Application{
		HelmConfig: helmConfig,
		K8s:        k8s,
		Releases: &Releases{
			Namespaces: namespaces,
			Settings:   settings,
			HelmConfig: helmConfig,
		},
		Repositories: &Repositories{
			Settings:          settings,
			HelmConfig:        hc,
			versionConstraint: semVerConstraint,
		},
	}, nil
}
