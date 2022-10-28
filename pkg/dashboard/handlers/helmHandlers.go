package handlers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"net/http"
	"strconv"
	"strings"
)

type HelmHandler struct {
	Data *subproc.DataLayer
}

func (h *HelmHandler) GetCharts(c *gin.Context) {
	res, err := h.Data.ListInstalled()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Uninstall(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	err = h.Data.ChartUninstall(qp.Namespace, qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) Rollback(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, true)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	err = h.Data.Revert(qp.Namespace, qp.Name, qp.Revision)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) History(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.ChartHistory(qp.Namespace, qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *HelmHandler) Resources(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, true)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	res, err := h.Data.RevisionManifestsParsed(qp.Namespace, qp.Name, qp.Revision)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
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
	qp, err := utils.GetQueryProps(c, true)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	flag := c.Query("flag") == "true"
	rDiff := c.Query("revisionDiff")
	res, err := handleGetSection(h.Data, c.Param("section"), rDiff, qp, flag)
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

func handleGetSection(data *subproc.DataLayer, section string, rDiff string, qp *utils.QueryProps, flag bool) (string, error) {
	sections := map[string]subproc.SectionFn{
		"manifests": data.RevisionManifests,
		"values":    data.RevisionValues,
		"notes":     data.RevisionNotes,
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

		res, err := subproc.RevisionDiff(functor, ext, qp.Namespace, qp.Name, cRevDiff, qp.Revision, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}

	res, err := functor(qp.Namespace, qp.Name, qp.Revision, flag)
	if err != nil {
		return "", err
	}
	return res, nil
}
