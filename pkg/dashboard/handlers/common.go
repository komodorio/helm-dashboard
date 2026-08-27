package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/v2/pkg/dashboard/objects"
)

const APP = "app"

type Contexted struct {
	Data *objects.DataLayer
}

func (h *Contexted) GetApp(c *gin.Context) *objects.Application {
	if a, ok := c.Get(APP); ok {
		if app, isApp := a.(*objects.Application); isApp {
			return app
		}
	}

	err := errorx.IllegalState.New("No application context found")
	_ = c.AbortWithError(http.StatusBadRequest, err)
	return nil
}

func (h *Contexted) EnableClientCache(c *gin.Context) {
	c.Header("Cache-Control", "max-age=43200")
}
