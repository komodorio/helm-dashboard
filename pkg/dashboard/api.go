package dashboard

import (
	"embed"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"net/http"
)

//go:embed static/*
var staticFS embed.FS

func newApi(abortWeb ControlChan, data DataLayer) *gin.Engine {
	api := gin.Default()

	// server a directory called static
	api.Use(static.Serve("/", http.FS(staticFS)))

	// static files
	api.StaticFileFS("/static", "static", http.FS(staticFS))

	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})

	api.GET("/api", func(c *gin.Context) {
		c.IndentedJSON(http.StatusOK, data.ListInstalled())
	})

	return api
}
