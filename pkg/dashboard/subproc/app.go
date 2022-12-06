package subproc

import (
	"github.com/joomcode/errorx"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

type Application struct {
	HelmConfig *action.Configuration
	Cache      *Cache

	releases     []*Release
	repositories []*Repository
}

func NewApplication(helmConfig *action.Configuration, cache *Cache) *Application {
	return &Application{
		HelmConfig: helmConfig,
		Cache:      cache,
	}
}

func (a *Application) GetReleases() ([]*release.Release, *errorx.Error) {
	// TODO: smart cached query
	client := action.NewList(a.HelmConfig)
	client.All = true
	client.AllNamespaces = true
	client.Limit = 0
	releases, err := client.Run()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}
	a.releases = []*Release{}
	return releases, nil
}

type Release struct {
	HelmConfig *action.Configuration
	Cache      *Cache
	Orig       *release.Release
}

type Repository struct {
}
