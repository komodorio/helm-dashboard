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
	var res []string
	for _, scanner := range h.Data.Scanners {
		res = append(res, scanner.Name())
	}
	c.JSON(http.StatusOK, res)
}

func (h *ScannersHandler) Run(c *gin.Context) {
	qp, err := utils.GetQueryProps(c, false)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	for _, scanner := range h.Data.Scanners {
		if scanner.Name() != c.Param("scanner") {
			continue
		}

		sr, err := scanner.Run(qp)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		c.JSON(http.StatusOK, sr)
		return
	}

	c.String(http.StatusNotFound, "Scanner with this name is not found")
}
