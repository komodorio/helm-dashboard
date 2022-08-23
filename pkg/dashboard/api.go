package dashboard

import (
	"embed"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"path"
)

//go:embed static/*
var staticFS embed.FS

func newRouter(abortWeb ControlChan, data DataLayer) *gin.Engine {
	api := gin.Default()
	fs := http.FS(staticFS)

	// local dev speed-up
	localDevPath := "pkg/dashboard/static"
	if _, err := os.Stat(localDevPath); err == nil {
		log.Warnf("Using local development path to serve static files")

		// the root page
		api.GET("/", func(c *gin.Context) {
			c.File(path.Join(localDevPath, "index.html"))
		})

		// serve a directory called static
		api.GET("/static/*filepath", func(c *gin.Context) {
			c.File(path.Join(localDevPath, c.Param("filepath")))
		})
	} else {
		// the root page
		api.GET("/", func(c *gin.Context) {
			c.FileFromFS("/static/", fs)
		})

		// serve a directory called static
		api.GET("/static/*filepath", func(c *gin.Context) {
			c.FileFromFS(c.Request.URL.Path, fs)
		})
	}

	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})

	api.GET("/api", func(c *gin.Context) {
		c.IndentedJSON(http.StatusOK, data.ListInstalled())
	})

	return api
}
