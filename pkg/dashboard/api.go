package dashboard

import (
	"embed"
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"path"
)

//go:embed static/*
var staticFS embed.FS

func noCache(c *gin.Context) {
	c.Header("Cache-Control", "no-cache")
	c.Next()
}

func errorHandler(c *gin.Context) {
	c.Next()

	errs := ""
	for _, err := range c.Errors {
		log.Debugf("Error: %s", err)
		errs += err.Error() + "\n"
	}

	if errs != "" {
		c.String(http.StatusInternalServerError, errs)
	}
}

func contextSetter(data *subproc.DataLayer) gin.HandlerFunc {
	return func(c *gin.Context) {
		if context, ok := c.Request.Header["X-Kubecontext"]; ok {
			log.Debugf("Setting current context to: %s", context)
			data.KubeContext = context[0]
		}
		c.Next()
	}
}

func NewRouter(abortWeb utils.ControlChan, data *subproc.DataLayer, version string) *gin.Engine {
	var api *gin.Engine
	if os.Getenv("DEBUG") == "" {
		api = gin.New()
		api.Use(gin.Recovery())
	} else {
		api = gin.Default()
	}

	api.Use(contextSetter(data))
	api.Use(noCache)
	api.Use(errorHandler)

	configureStatic(api)
	configureRoutes(abortWeb, data, api, version)

	return api
}

func configureRoutes(abortWeb utils.ControlChan, data *subproc.DataLayer, api *gin.Engine, version string) {
	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
		c.Status(http.StatusAccepted)
	})

	api.GET("/status", func(c *gin.Context) {
		c.String(http.StatusOK, version)
	})

	configureHelms(api.Group("/api/helm"), data)
	configureKubectls(api.Group("/api/kube"), data)
	configureScanners(api.Group("/api/scanners"), data)
}

func configureHelms(api *gin.RouterGroup, data *subproc.DataLayer) {
	h := handlers.HelmHandler{Data: data}
	api.GET("/charts", h.GetCharts)
	api.DELETE("/charts", h.Uninstall)
	api.POST("/charts/rollback", h.Rollback)
	api.GET("/charts/history", h.History)
	api.GET("/charts/resources", h.Resources)
	api.GET("/repo/search", h.RepoSearch)
	api.POST("/repo/update", h.RepoUpdate)
	api.GET("/repo/values", h.RepoValues)
	api.POST("/charts/install", h.Install)
	api.GET("/charts/:section", h.GetInfoSection)
}

func configureKubectls(api *gin.RouterGroup, data *subproc.DataLayer) {
	h := handlers.KubeHandler{Data: data}
	api.GET("/contexts", h.GetContexts)
	api.GET("/resources/:kind", h.GetResourceInfo)
	api.GET("/describe/:kind", h.Describe)
}

func configureStatic(api *gin.Engine) {
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
}

func configureScanners(api *gin.RouterGroup, data *subproc.DataLayer) {
	h := handlers.ScannersHandler{Data: data}
	api.GET("", h.List)
	api.POST("/:scanner", h.Run)
}
