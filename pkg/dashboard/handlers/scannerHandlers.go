package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/scanners"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"net/http"
)

type ScannersHandler struct {
	Data *DataLayer
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

	res := map[string]*scanners.ScanResults{}
	for _, scanner := range h.Data.Scanners {
		mnf, err := h.Data.ChartUpgrade(qp.Namespace, qp.Name, c.Query("chart"), c.Query("version"), true, c.PostForm("values"))
		if err != nil {
			res[scanner.Name()] = &scanners.ScanResults{Error: err}
			continue
		}

		sr, err := scanner.Run(mnf)
		if err != nil {
			res[scanner.Name()] = &scanners.ScanResults{Error: err}
			continue
		}

		res[scanner.Name()] = sr
	}

	c.JSON(http.StatusOK, res)
}
