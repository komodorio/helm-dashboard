package dashboard

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type HelmHandler struct {
	Data *DataLayer
}

func (h *HelmHandler) GetCharts(c *gin.Context) {
	res, err := h.Data.ListInstalled()
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.IndentedJSON(http.StatusOK, res)
}

// TODO: helm show chart komodorio/k8s-watcher to get the icon URL

func (h *HelmHandler) Uninstall(c *gin.Context) {
	qp, err := getQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	err = h.Data.UninstallChart(qp.Namespace, qp.Name)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *HelmHandler) Rollback(c *gin.Context) {
	qp, err := getQueryProps(c, true)
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
	qp, err := getQueryProps(c, false)
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
	qp, err := getQueryProps(c, true)
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
	qp, err := getQueryProps(c, false)
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

func (h *HelmHandler) RepoUpdate(c *gin.Context) {
	qp, err := getQueryProps(c, false)
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
	qp, err := getQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	justTemplate := c.Query("flag") != "true"
	out, err := h.Data.ChartUpgrade(qp.Namespace, qp.Name, c.Query("chart"), c.Query("version"), justTemplate, c.PostForm("values"))
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	if !justTemplate {
		c.Header("Content-Type", "application/json")
	}

	c.String(http.StatusAccepted, out)
}

func (h *HelmHandler) GetInfoSection(c *gin.Context) {
	qp, err := getQueryProps(c, true)
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

func handleGetSection(data *DataLayer, section string, rDiff string, qp *QueryProps, flag bool) (string, error) {
	sections := map[string]SectionFn{
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

		res, err := RevisionDiff(functor, ext, qp.Namespace, qp.Name, cRevDiff, qp.Revision, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	} else {
		res, err := functor(qp.Namespace, qp.Name, qp.Revision, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}
}
