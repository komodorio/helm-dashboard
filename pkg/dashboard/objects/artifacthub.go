package objects

import (
	"encoding/json"
	"fmt"
	"net/http"
	neturl "net/url"
	"os"
	"sync"

	log "github.com/sirupsen/logrus"
)

var mxArtifactHub sync.Mutex

func QueryArtifactHub(chartName string) ([]*ArtifactHubResult, error) {
	mxArtifactHub.Lock() // to avoid parallel request spike
	defer mxArtifactHub.Unlock()

	url := os.Getenv("HD_ARTIFACT_HUB_URL")
	if url == "" {
		url = "https://artifacthub.io/api/v1/packages/search"
	}

	p, err := neturl.Parse(url)
	if err != nil {
		return nil, err
	}

	p.RawQuery = "offset=0&limit=5&facets=false&kind=0&deprecated=false&sort=relevance&ts_query_web=" + neturl.QueryEscape(chartName)

	req, err := http.NewRequest("GET", p.String(), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Komodor Helm Dashboard/"+os.Getenv("HD_VERSION")) // TODO

	log.Debugf("Making HTTP request: %v", req)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return nil, fmt.Errorf("failed to fetch %s : %s", p.String(), res.Status)
	}

	result := ArtifactHubResults{}

	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result.Packages, nil
}

type ArtifactHubResults struct {
	Packages []*ArtifactHubResult `json:"packages"`
}

type ArtifactHubResult struct {
	PackageId                    string          `json:"package_id"`
	Name                         string          `json:"name"`
	NormalizedName               string          `json:"normalized_name"`
	LogoImageId                  string          `json:"logo_image_id"`
	Stars                        int             `json:"stars"`
	Description                  string          `json:"description"`
	Version                      string          `json:"version"`
	AppVersion                   string          `json:"app_version"`
	Deprecated                   bool            `json:"deprecated"`
	Signed                       bool            `json:"signed"`
	ProductionOrganizationsCount int             `json:"production_organizations_count"`
	Ts                           int             `json:"ts"`
	Repository                   ArtifactHubRepo `json:"repository"`
}

type ArtifactHubRepo struct {
	Url                     string `json:"url"`
	Kind                    int    `json:"kind"`
	Name                    string `json:"name"`
	Official                bool   `json:"official"`
	DisplayName             string `json:"display_name"`
	RepositoryId            string `json:"repository_id"`
	ScannerDisabled         bool   `json:"scanner_disabled"`
	OrganizationName        string `json:"organization_name"`
	VerifiedPublisher       bool   `json:"verified_publisher"`
	OrganizationDisplayName string `json:"organization_display_name"`
}
