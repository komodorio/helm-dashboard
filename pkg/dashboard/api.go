package dashboard

import (
	"embed"
	"github.com/gin-gonic/gin"
	"net/http"
)

//go:embed static/*
var staticFS embed.FS

func newApi(abortWeb ControlChan, data DataLayer) *gin.Engine {
	api := gin.Default()
	fs := http.FS(staticFS)

	// the root page
	api.GET("/", func(c *gin.Context) {
		c.FileFromFS("/static/", fs)
	})

	// serve a directory called static
	api.GET("/static/*filepath", func(c *gin.Context) {
		c.FileFromFS(c.Request.URL.Path, fs)
	})

	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})

	api.GET("/api", func(c *gin.Context) {
		c.IndentedJSON(http.StatusOK, data.ListInstalled())
	})

	return api
}
