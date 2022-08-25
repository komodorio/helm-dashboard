package dashboard

import (
	"github.com/Masterminds/semver/v3"
	"helm.sh/helm/v3/pkg/release"
	helmtime "helm.sh/helm/v3/pkg/time"
)

// unpleasant copy from Helm sources, where they have it non-public
type releaseElement struct {
	Name       string         `json:"name"`
	Namespace  string         `json:"namespace"`
	Revision   string         `json:"revision"`
	Updated    string         `json:"updated"`
	Status     release.Status `json:"status"`
	Chart      string         `json:"chart"`
	AppVersion semver.Version `json:"app_version"`
}

type historyElement struct {
	Revision    int            `json:"revision"`
	Updated     helmtime.Time  `json:"updated"`
	Status      release.Status `json:"status"`
	Chart       string         `json:"chart"`
	AppVersion  semver.Version `json:"app_version"`
	Description string         `json:"description"`
}

type repoChartElement struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	AppVersion  string `json:"app_version"`
	Description string `json:"description"`
}
