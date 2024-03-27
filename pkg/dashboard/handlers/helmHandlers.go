package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hexops/gotextdiff"
	"github.com/hexops/gotextdiff/myers"
	"github.com/hexops/gotextdiff/span"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"golang.org/x/mod/semver"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/release"
	helmtime "helm.sh/helm/v3/pkg/time"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/utils/strings/slices"
)

type HelmHandler struct {
	*Contexted
}

func (h *HelmHandler) getRelease(c *gin.Context) *objects.Release {
	app := h.GetApp(c)
	if app == nil {
		return nil
	}

	rel, err := app.Releases.ByName(c.Param("ns"), c.Param("name"))
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return nil
	}
	return rel
}

func (h *HelmHandler) GetReleases(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	rels, err := app.Releases.List()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	res := []*ReleaseElement{}
	for _, r := range rels {
		res = append(res, HReleaseToJSON(r.Orig))
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Uninstall(c *gin.Context) {
	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	err := rel.Uninstall()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) Rollback(c *gin.Context) {
	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	revn, err := strconv.Atoi(c.PostForm("revision"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	err = rel.Rollback(revn)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) History(c *gin.Context) {
	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	revs, err := rel.History()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	res := []*HistoryElement{}
	for _, r := range revs {
		res = append(res, HReleaseToHistElem(r.Orig))
	}

	sort.Slice(res, func(i, j int) bool {
		return res[i].Revision < res[j].Revision
	})

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Resources(c *gin.Context) {
	// can't enable the client cache because resource list changes with time

	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	res, err := objects.ParseManifests(rel.Orig.Manifest)
	if err != nil {
		res = append(res, &v1.Carp{
			TypeMeta: metav1.TypeMeta{Kind: "ManifestParseError"},
			ObjectMeta: metav1.ObjectMeta{
				Name: err.Error(),
			},
			Spec: v1.CarpSpec{},
			Status: v1.CarpStatus{
				Phase:   "BrokenManifest",
				Message: err.Error(),
			},
		})
		//_ = c.AbortWithError(http.StatusInternalServerError, err)
		//return
	}

	if c.Query("health") != "" { // we need  to query k8s for health status
		app := h.GetApp(c)
		if app == nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		for _, obj := range res {
			ns := obj.Namespace
			if ns == "" {
				ns = c.Param("ns")
			}
			info, err := app.K8s.GetResourceInfo(obj.Kind, ns, obj.Name)
			if err != nil {
				log.Warnf("Failed to get resource info for %s %s/%s: %+v", obj.Name, ns, obj.Name, err)
				info = &v1.Carp{}
			}
			obj.Status = *EnhanceStatus(info, err)
		}
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) RepoVersions(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	repos, err := app.Repositories.Containing(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	res := []*RepoChartElement{}
	for _, r := range repos {
		res = append(res, &RepoChartElement{
			Name:        r.Name,
			Version:     r.Version,
			AppVersion:  r.AppVersion,
			Description: r.Description,
			Repository:  r.Annotations[objects.AnnRepo],
			URLs:        r.URLs,
		})
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) RepoLatestVer(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	rep, err := app.Repositories.Containing(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	res := []*RepoChartElement{}
	for _, r := range rep {
		res = append(res, &RepoChartElement{
			Name:        r.Name,
			Version:     r.Version,
			AppVersion:  r.AppVersion,
			Description: r.Description,
			Repository:  r.Annotations[objects.AnnRepo],
			URLs:        r.URLs,
		})
	}

	sort.Slice(res, func(i, j int) bool {
		return semver.Compare(res[i].Version, res[j].Version) > 0
	})

	if len(res) > 0 {
		c.IndentedJSON(http.StatusOK, res[:1])
	} else {
		if utils.EnvAsBool("HD_NO_ARTIFACT_HUB_QUERY", false) {
			c.Status(http.StatusNoContent)
			return
		}

		// caching it to avoid too many requests
		found, err := h.Data.Cache.String("chart-artifacthub-query/"+qp.Name, nil, func() (string, error) {
			return h.repoFromArtifactHub(qp.Name)
		})
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		if found == "" {
			c.Status(http.StatusNoContent)
		} else {
			c.Header("Content-Type", "application/json")
			c.String(http.StatusOK, found)
		}
	}
}

func (h *HelmHandler) RepoCharts(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	rep, err := app.Repositories.Get(c.Param("name"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	charts, err := rep.Charts()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	sort.Slice(charts, func(i, j int) bool {
		return charts[i].Name < charts[j].Name
	})

	c.IndentedJSON(http.StatusOK, charts)
}

func (h *HelmHandler) RepoUpdate(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	rep, err := app.Repositories.Get(c.Param("name"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	err = rep.Update()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) Install(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	values := map[string]interface{}{}
	err := yaml.Unmarshal([]byte(c.PostForm("values")), &values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	repoChart, err := h.checkLocalRepo(c.PostForm("chart"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	justTemplate := c.PostForm("preview") == "true"
	ns := c.Param("ns")
	if ns == "[empty]" {
		ns = ""
	}

	rel, err := app.Releases.Install(ns, c.PostForm("name"), repoChart, c.PostForm("version"), justTemplate, values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if justTemplate {
		c.IndentedJSON(http.StatusOK, rel)
	} else {
		c.IndentedJSON(http.StatusAccepted, rel)
	}
}

func (h *HelmHandler) checkLocalRepo(repoChart string) (string, error) {
	if strings.HasPrefix(repoChart, "file://") {
		repoChart = repoChart[len("file://"):]
		if !slices.Contains(h.Data.LocalCharts, repoChart) {
			return "", fmt.Errorf("chart path is not present in local charts: %s", repoChart)
		}
	}
	return repoChart, nil
}

func (h *HelmHandler) Upgrade(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	existing, err := app.Releases.ByName(c.Param("ns"), c.Param("name"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	values := map[string]interface{}{}
	err = yaml.Unmarshal([]byte(c.PostForm("values")), &values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	repoChart, err := h.checkLocalRepo(c.PostForm("chart"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	justTemplate := c.PostForm("preview") == "true"
	rel, err := existing.Upgrade(repoChart, c.PostForm("version"), justTemplate, values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if justTemplate {
		c.IndentedJSON(http.StatusOK, rel)
	} else {
		c.IndentedJSON(http.StatusAccepted, rel)
	}
}

func (h *HelmHandler) RunTests(c *gin.Context) {
	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	out, err := rel.RunTests()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.String(http.StatusOK, out)
}

func (h *HelmHandler) GetInfoSection(c *gin.Context) {
	if c.Query("revision") != "" { // don't cache if latest is requested
		h.EnableClientCache(c)
	}

	rel := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	revn, err := strconv.Atoi(c.Query("revision"))
	if c.Query("revision") != "" && err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	rev, err := rel.GetRev(revn)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	var revDiff *objects.Release
	revS := c.Query("revisionDiff")
	if revS != "" {
		revN, err := strconv.Atoi(revS)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		revDiff, err = rel.GetRev(revN)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}

	flag := c.Query("userDefined") == "true"

	res, err := h.handleGetSection(rev, c.Param("section"), revDiff, flag)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.String(http.StatusOK, res)
}

func (h *HelmHandler) RepoValues(c *gin.Context) {
	h.EnableClientCache(c)

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	repoChart, err := h.checkLocalRepo(c.Query("chart"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	out, err := app.Repositories.GetChartValues(repoChart, c.Query("version"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.String(http.StatusOK, out)
}

func (h *HelmHandler) RepoList(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	repos, err := app.Repositories.List()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	out := []RepositoryElement{}
	for _, r := range repos {
		out = append(out, RepositoryElement{
			Name: r.Name(),
			URL:  r.URL(),
		})
	}

	c.IndentedJSON(http.StatusOK, out)
}

func (h *HelmHandler) RepoAdd(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	// TODO: more repo options to accept
	err := app.Repositories.Add(c.PostForm("name"), c.PostForm("url"), c.PostForm("username"), c.PostForm("password"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) RepoDelete(c *gin.Context) {
	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	err := app.Repositories.Delete(c.Param("name"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) handleGetSection(rel *objects.Release, section string, rDiff *objects.Release, flag bool) (string, error) {
	sections := map[string]objects.SectionFn{
		"manifests": func(qp *release.Release, b bool) (string, error) { return qp.Manifest, nil },
		"notes":     func(qp *release.Release, b bool) (string, error) { return qp.Info.Notes, nil },
		"values": func(qp *release.Release, b bool) (string, error) {
			allVals := qp.Config

			if !b {
				merged, err := chartutil.CoalesceValues(qp.Chart, qp.Config)
				if err != nil {
					return "", errorx.Decorate(err, "failed to merge chart vals with user defined")
				}
				allVals = merged
			}

			if len(allVals) > 0 {
				data, err := yaml.Marshal(allVals)
				if err != nil {
					return "", errorx.Decorate(err, "failed to serialize values into YAML")
				}
				return string(data), nil
			}
			return "", nil
		},
	}

	functor, found := sections[section]
	if !found {
		return "", errors.New("unsupported section: " + section)
	}

	if rDiff != nil {
		ext := ".yaml"
		if section == "notes" {
			ext = ".txt"
		}

		res, err := RevisionDiff(functor, ext, rDiff.Orig, rel.Orig, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}

	res, err := functor(rel.Orig, flag)
	if err != nil {
		return "", errorx.Decorate(err, "failed to get section info")
	}
	return res, nil
}

func (h *HelmHandler) repoFromArtifactHub(name string) (string, error) {
	results, err := objects.QueryArtifactHub(name)
	if err != nil {
		log.Warnf("Failed to query ArtifactHub: %s", err)
		return "", nil // swallowing the error to not annoy users
	}

	if len(results) == 0 {
		return "", nil
	}

	sort.SliceStable(results, func(i, j int) bool {
		ri, rj := results[i], results[j]

		// we prefer official repos
		if ri.Repository.Official && !rj.Repository.Official {
			return true
		}

		// more popular
		if ri.Stars != rj.Stars {
			return ri.Stars > rj.Stars
		}

		// or from verified publishers
		if ri.Repository.VerifiedPublisher && !rj.Repository.VerifiedPublisher {
			return true
		}

		// or with more recent app version
		c := semver.Compare("v"+ri.AppVersion, "v"+rj.AppVersion)
		if c != 0 {
			return c > 0
		}

		// shorter repo name is usually closer to officials
		return len(ri.Repository.Name) < len(rj.Repository.Name)
	})

	r := results[0]
	buf, err := json.Marshal([]*RepoChartElement{{
		Name:            r.Name,
		Version:         r.Version,
		AppVersion:      r.AppVersion,
		Description:     r.Description,
		Repository:      r.Repository.Name,
		URLs:            []string{r.Repository.Url},
		IsSuggestedRepo: true,
	}})
	if err != nil {
		return "", err
	}

	return string(buf), nil
}

type RepoChartElement struct { // TODO: do we need it at all? there is existing repo.ChartVersion in Helm
	Name        string `json:"name"`
	Version     string `json:"version"`
	AppVersion  string `json:"app_version"`
	Description string `json:"description"`

	InstalledNamespace string   `json:"installed_namespace"`
	InstalledName      string   `json:"installed_name"`
	Repository         string   `json:"repository"`
	URLs               []string `json:"urls"`
	IsSuggestedRepo    bool     `json:"isSuggestedRepo"`
}

func HReleaseToJSON(o *release.Release) *ReleaseElement {
	return &ReleaseElement{
		Name:         o.Name,
		Namespace:    o.Namespace,
		Revision:     strconv.Itoa(o.Version),
		Updated:      o.Info.LastDeployed,
		Status:       o.Info.Status,
		Chart:        fmt.Sprintf("%s-%s", o.Chart.Name(), o.Chart.Metadata.Version),
		ChartName:    o.Chart.Name(),
		ChartVersion: o.Chart.Metadata.Version,
		AppVersion:   o.Chart.AppVersion(),
		Icon:         o.Chart.Metadata.Icon,
		Description:  o.Chart.Metadata.Description,
	}
}

type ReleaseElement struct {
	Name         string         `json:"name"`
	Namespace    string         `json:"namespace"`
	Revision     string         `json:"revision"`
	Updated      helmtime.Time  `json:"updated"`
	Status       release.Status `json:"status"`
	Chart        string         `json:"chart"`
	ChartName    string         `json:"chartName"`
	ChartVersion string         `json:"chartVersion"`
	AppVersion   string         `json:"app_version"`
	Icon         string         `json:"icon"`
	Description  string         `json:"description"`
}

type RepositoryElement struct {
	Name string `json:"name"`
	URL  string `json:"url"`
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
	HasTests  bool   `json:"has_tests"`
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
		HasTests:    releaseHasTests(o),
	}
}

func RevisionDiff(functor objects.SectionFn, ext string, revision1 *release.Release, revision2 *release.Release, flag bool) (string, error) {
	if revision1 == nil || revision2 == nil {
		log.Debugf("One of revisions is nil: %v %v", revision1, revision2)
		return "", nil
	}

	manifest1, err := functor(revision1, flag)
	if err != nil {
		return "", err
	}

	manifest2, err := functor(revision2, flag)
	if err != nil {
		return "", err
	}

	diff := GetDiff(manifest1, manifest2, strconv.Itoa(revision1.Version)+ext, strconv.Itoa(revision2.Version)+ext)
	return diff, nil
}

func GetDiff(text1 string, text2 string, name1 string, name2 string) string {
	edits := myers.ComputeEdits(span.URIFromPath(""), text1, text2)
	unified := gotextdiff.ToUnified(name1, name2, text1, edits)
	diff := fmt.Sprint(unified)
	log.Debugf("The diff is: %s", diff)
	return diff
}

func releaseHasTests(o *release.Release) bool {
	for _, h := range o.Hooks {
		for _, e := range h.Events {
			if e == release.HookTest {
				return true
			}
		}
	}
	return false
}
