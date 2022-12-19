package handlers

import (
	"errors"
	"github.com/joomcode/errorx"
	"helm.sh/helm/v3/pkg/chartutil"
	"net/http"
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

	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Resources(c *gin.Context) {
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

func (h *HelmHandler) RepoSearch(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.ChartRepoVersions(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) RepoCharts(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.ChartRepoCharts(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
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

func (h *HelmHandler) Show(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.ShowChart(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.IndentedJSON(http.StatusOK, res)
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
	rel, _ := h.getRelease(c)
	if rel == nil {
		return // error state is set inside
	}

	flag := c.Query("flag") == "true"
	rDiff := c.Query("revisionDiff")
	res, err := handleGetSection(h.Data, c.Param("section"), rDiff, rel, flag)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.String(http.StatusOK, res)
}

func (h *HelmHandler) RepoValues(c *gin.Context) {
	out, err := h.Data.ShowValues(c.Query("chart"), c.Query("version"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.String(http.StatusOK, out)
}

func (h *HelmHandler) RepoList(c *gin.Context) {
	out, err := h.Data.ChartRepoList()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, out)
}

func (h *HelmHandler) RepoAdd(c *gin.Context) {
	_, err := h.Data.ChartRepoAdd(c.PostForm("name"), c.PostForm("url"))
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

	_, err = h.Data.ChartRepoDelete(qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func handleGetSection(rel *subproc.Release, section string, rDiff string, flag bool) (string, error) {
	qp := rel.Orig

	sections := map[string]subproc.SectionFn{
		"manifests": func(b bool) (string, error) { return qp.Manifest, nil },
		"notes":     func(b bool) (string, error) { return qp.Info.Notes, nil },
		"values": func(b bool) (string, error) {
			allVals := qp.Config
			allVals, err := chartutil.CoalesceValues(qp.Chart, qp.Config)
			if err != nil {
				return "", errorx.Decorate(err, "failed to merge chart vals with user defined")
			}

			return allVals, nil
		},
	}

	functor, found := sections[section]
	if !found {
		return "", errors.New("unsupported section: " + section)
	}

	if rDiff != "" {
		cRevDiff, err := strconv.Atoi(rDiff)
		if err != nil {
			return "", err
		}

		ext := ".yaml"
		if section == "notes" {
			ext = ".txt"
		}

		res, err := subproc.RevisionDiff(functor, ext, qp.Namespace, qp.Name, cRevDiff, qp.Version, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}

	res, err := functor(flag)
	if err != nil {
		return "", err
	}
	return res, nil
}
