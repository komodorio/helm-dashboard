package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"net/http"
)

type ScannersHandler struct {
	Data *subproc.DataLayer
}

func (h *ScannersHandler) List(c *gin.Context) {
	res := make([]string, 0)
	for _, scanner := range h.Data.Scanners {
		res = append(res, scanner.Name())
	}
	c.JSON(http.StatusOK, res)
}

func (h *ScannersHandler) ScanDraftManifest(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	reuseVals := c.Query("initial") != "true"
	mnf, err := h.Data.ChartInstall(qp.Namespace, qp.Name, c.Query("chart"), c.Query("version"), true, c.PostForm("values"), reuseVals)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	reps := map[string]*subproc.ScanResults{}
	for _, scanner := range h.Data.Scanners {
		sr, err := scanner.ScanManifests(mnf)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		reps[scanner.Name()] = sr
	}

	c.IndentedJSON(http.StatusOK, reps)
}

func (h *ScannersHandler) ScanResource(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	reps := map[string]*subproc.ScanResults{}
	for _, scanner := range h.Data.Scanners {
		sr, err := scanner.ScanResource(qp.Namespace, c.Param("kind"), qp.Name)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		reps[scanner.Name()] = sr
	}

	c.IndentedJSON(http.StatusOK, reps)
}
