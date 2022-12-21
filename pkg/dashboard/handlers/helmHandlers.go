package handlers

import (
	"errors"
	"github.com/joomcode/errorx"
	"github.com/rogpeppe/go-internal/semver"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/repo"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
)

type HelmHandler struct {
	*Contexted
}

func (h *HelmHandler) getRelease(c *gin.Context) (*subproc.Release, *utils.QueryProps) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return nil, nil
	}

	app := h.GetApp(c)
	if app == nil {
		return nil, qp // sets error inside
	}

	rel, err := app.Releases.ByName(qp.Namespace, qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return nil, qp
	}
	return rel, qp
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

	res := []*subproc.ReleaseElement{}
	for _, r := range rels {
		res = append(res, subproc.HReleaseToJSON(r.Orig))
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Uninstall(c *gin.Context) {
	rel, _ := h.getRelease(c)
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
	rel, qp := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	err := rel.Rollback(qp.Revision)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) History(c *gin.Context) {
	rel, _ := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	revs, err := rel.History()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	res := []*subproc.HistoryElement{}
	for _, r := range revs {
		res = append(res, subproc.HReleaseToHistElem(r.Orig))
	}

	sort.Slice(res, func(i, j int) bool {
		return res[i].Revision < res[j].Revision
	})

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Resources(c *gin.Context) {
	h.EnableClientCache(c)

	rel, _ := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	res, err := subproc.ParseManifests(rel.Orig.Manifest)
	if err != nil {
		return
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) RepoVersions(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
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

	res := []*subproc.RepoChartElement{}
	for _, r := range rep {
		res = append(res, &subproc.RepoChartElement{
			Name:        r.Name,
			Version:     r.Version,
			AppVersion:  r.AppVersion,
			Description: r.Description,
			Repository:  r.Annotations[subproc.AnnRepo],
		})
	}

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) RepoLatestVer(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
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

	res := []*subproc.RepoChartElement{}
	for _, r := range rep {
		res = append(res, &subproc.RepoChartElement{
			Name:        r.Name,
			Version:     r.Version,
			AppVersion:  r.AppVersion,
			Description: r.Description,
			Repository:  r.Annotations[subproc.AnnRepo],
		})
	}

	sort.Slice(res, func(i, j int) bool {
		return semver.Compare(res[i].Version, res[j].Version) > 0
	})

	c.IndentedJSON(http.StatusOK, res[:1])
}

func (h *HelmHandler) RepoCharts(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	rep, err := app.Repositories.Get(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	charts, err := rep.Charts()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	installed, err := app.Releases.List()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// TODO: enrich with installed
	enrichRepoChartsWithInstalled(charts, installed)

	sort.Slice(charts, func(i, j int) bool {
		return charts[i].Name < charts[j].Name
	})

	c.IndentedJSON(http.StatusOK, charts)
}

func enrichRepoChartsWithInstalled(charts []*repo.ChartVersion, installed []*subproc.Release) {
	for _, rchart := range charts {
		for _, rel := range installed {
			if rchart.Metadata.Name == rel.Orig.Chart.Name() {
				log.Debugf("Matched") // TODO: restore implementation
				// TODO: there can be more than one
				//rchart.InstalledNamespace = rel.Orig.Namespace
				//rchart.InstalledName = rel.Orig.Name
			}
		}
	}
}

func (h *HelmHandler) RepoUpdate(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	err = h.Data.ChartRepoUpdate(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) Install(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	justTemplate := c.Query("flag") != "true"
	isInitial := c.Query("initial") != "true"
	out, err := h.Data.ChartInstall(qp.Namespace, qp.Name, c.Query("chart"), c.Query("version"), justTemplate, c.PostForm("values"), isInitial)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if justTemplate {
		manifests := ""
		if isInitial {
			manifests, err = h.Data.RevisionManifests(qp.Namespace, qp.Name, 0, false)
			if err != nil {
				_ = c.AbortWithError(http.StatusInternalServerError, err)
				return
			}
		}
		out = subproc.GetDiff(strings.TrimSpace(manifests), out, "current.yaml", "upgraded.yaml")
	} else {
		c.Header("Content-Type", "application/json")
	}

	c.String(http.StatusAccepted, out)
}

func (h *HelmHandler) GetInfoSection(c *gin.Context) {
	h.EnableClientCache(c)

	rel, qp := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	rev, err := rel.GetRev(qp.Revision)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	var revDiff *subproc.Release
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

	flag := c.Query("flag") == "true"

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

	out, err := app.Repositories.GetChartValues(c.Query("chart"), c.Query("version"))
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

	out := []subproc.RepositoryElement{}
	for _, r := range repos {
		out = append(out, subproc.RepositoryElement{
			Name: r.Orig.Name,
			URL:  r.Orig.URL,
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
	err := app.Repositories.Add(c.PostForm("name"), c.PostForm("url"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) RepoDelete(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	err = app.Repositories.Delete(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HelmHandler) handleGetSection(rel *subproc.Release, section string, rDiff *subproc.Release, flag bool) (string, error) {
	sections := map[string]subproc.SectionFn{
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

			data, err := yaml.Marshal(allVals)
			if err != nil {
				return "", errorx.Decorate(err, "failed to serialize values into YAML")
			}

			return string(data), nil
		},
	}

	functor, found := sections[section]
	if !found {
		return "", errors.New("unsupported section: " + section)
	}

	oRel, err := rel.OrigFull()
	if err != nil {
		return "", errorx.Decorate(err, "failed to get full revision info")
	}

	if rDiff != nil {
		ext := ".yaml"
		if section == "notes" {
			ext = ".txt"
		}

		oDiff, err := rDiff.OrigFull()
		if err != nil {
			return "", errorx.Decorate(err, "failed to get full diff revision info")
		}

		res, err := subproc.RevisionDiff(functor, ext, oDiff, oRel, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}

	res, err := functor(oRel, flag)
	if err != nil {
		return "", errorx.Decorate(err, "failed to get section info")
	}
	return res, nil
}
