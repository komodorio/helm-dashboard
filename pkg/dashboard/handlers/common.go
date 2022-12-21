package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"net/http"
)

const APP = "app"

type Contexted struct {
	Data *subproc.DataLayer
}

func (h *Contexted) GetApp(c *gin.Context) *subproc.Application {
	var app *subproc.Application
	if a, ok := c.Get(APP); ok {
		app = a.(*subproc.Application)
	} else {
		err := errorx.IllegalState.New("No application context found")
		_ = c.AbortWithError(http.StatusBadRequest, err)
		return nil
	}

	return app
}

func (h *Contexted) EnableClientCache(c *gin.Context) {
	c.Header("Cache-Control", "max-age=43200")
}
