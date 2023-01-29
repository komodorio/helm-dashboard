package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"gopkg.in/yaml.v3"
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

func (h *ScannersHandler) ScanDraftManifest(c *gin.Context) {
	qp, err := utils.GetQueryProps(c)
	if err != nil {
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	app := h.GetApp(c)
	if app == nil {
		return // sets error inside
	}

	values := map[string]interface{}{}
	err = yaml.Unmarshal([]byte(c.PostForm("values")), &values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// TODO: should just accept the manifest instead of generating it itself
	mnf, err := app.Releases.Install(qp.Namespace, qp.Name, c.Query("chart"), c.Query("version"), true, values)
	if err != nil {
		_ = c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	reps := map[string]*subproc.ScanResults{}
	for _, scanner := range h.Data.Scanners {
		sr, err := scanner.ScanManifests(mnf.Manifest)
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
