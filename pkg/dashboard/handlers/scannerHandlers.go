package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"net/http"
)

type ScannersHandler struct {
	*Contexted
}

func (h *ScannersHandler) List(c *gin.Context) {
	type ScannerInfo struct {
		SupportedResourceKinds []string
		ManifestScannable      bool
	}
	res := map[string]ScannerInfo{}
	for _, scanner := range h.Data.Scanners {
		res[scanner.Name()] = ScannerInfo{
			SupportedResourceKinds: scanner.SupportedResourceKinds(),
			ManifestScannable:      scanner.ManifestIsScannable(),
		}
	}
	c.IndentedJSON(http.StatusOK, res)
}

func (h *ScannersHandler) ScanManifest(c *gin.Context) {
	reps := map[string]*subproc.ScanResults{}
	for _, scanner := range h.Data.Scanners {
		sr, err := scanner.ScanManifests(c.PostForm("manifest"))
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		reps[scanner.Name()] = sr
	}

	c.IndentedJSON(http.StatusOK, reps)
}

func (h *ScannersHandler) ScanResource(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
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
