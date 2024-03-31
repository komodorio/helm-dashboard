package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
)

const APP = "app"

type Contexted struct {
	Data *objects.DataLayer
}

func (h *Contexted) GetApp(c *gin.Context) *objects.Application {
	var app *objects.Application
	if a, ok := c.Get(APP); ok {
		app = a.(*objects.Application)
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
