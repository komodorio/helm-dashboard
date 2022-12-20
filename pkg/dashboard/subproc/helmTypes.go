package subproc

import (
	"fmt"
	"helm.sh/helm/v3/pkg/release"
	helmtime "helm.sh/helm/v3/pkg/time"
	"strconv"
)

// unpleasant copy from Helm sources, where they have it non-public

type ReleaseElement struct {
	Name        string         `json:"name"`
	Namespace   string         `json:"namespace"`
	Revision    string         `json:"revision"`
	Updated     helmtime.Time  `json:"updated"`
	Status      release.Status `json:"status"`
	Chart       string         `json:"chart"`
	AppVersion  string         `json:"app_version"`
	Icon        string         `json:"icon"`
	Description string
}

type HistoryElement struct {
	Revision    int            `json:"revision"`
	Updated     helmtime.Time  `json:"updated"`
	Status      release.Status `json:"status"`
	Chart       string         `json:"chart"`
	AppVersion  string         `json:"app_version"`
	Description string         `json:"description"`

	ChartName string `json:"chart_name"` // custom addition on top of Helm
	ChartVer  string `json:"chart_ver"`  // custom addition on top of Helm
}

type RepoChartElement struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	AppVersion  string `json:"app_version"`
	Description string `json:"description"`

	InstalledNamespace string `json:"installed_namespace"` // custom addition on top of Helm
	InstalledName      string `json:"installed_name"`      // custom addition on top of Helm
	Repository         string `json:"repository"`
}

type RepositoryElement struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

func HReleaseToJSON(o *release.Release) *ReleaseElement {
	return &ReleaseElement{
		Name:        o.Name,
		Namespace:   o.Namespace,
		Revision:    strconv.Itoa(o.Version),
		Updated:     o.Info.LastDeployed,
		Status:      o.Info.Status,
		Chart:       fmt.Sprintf("%s-%s", o.Chart.Name(), o.Chart.Metadata.Version),
		AppVersion:  o.Chart.AppVersion(),
		Icon:        o.Chart.Metadata.Icon,
		Description: o.Chart.Metadata.Description,
	}
}

func HReleaseToHistElem(o *release.Release) *HistoryElement {
	return &HistoryElement{
		Revision:    o.Version,
		Updated:     o.Info.LastDeployed,
		Status:      o.Info.Status,
		Chart:       fmt.Sprintf("%s-%s", o.Chart.Name(), o.Chart.Metadata.Version),
		AppVersion:  o.Chart.AppVersion(),
		Description: o.Info.Description,
		ChartName:   o.Chart.Name(),
		ChartVer:    o.Chart.Metadata.Version,
	}
}
