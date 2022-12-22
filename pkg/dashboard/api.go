package dashboard

import (
	"embed"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"html"
	"net/http"
	"os"
	"path"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
)

//go:embed static/*
var staticFS embed.FS

func noCache(c *gin.Context) {
	if c.GetHeader("Cache-Control") == "" { // default policy is not to cache
		c.Header("Cache-Control", "no-cache")
	}
	c.Next()
}

func errorHandler(c *gin.Context) {
	c.Next()

	errs := ""
	for _, err := range c.Errors {
		log.Debugf("Error: %+v", err)
		errs += err.Error() + "\n"
	}

	if errs != "" {
		c.String(http.StatusInternalServerError, html.EscapeString(errs))
	}
}

func contextSetter(data *objects.DataLayer) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctxName := ""
		if ctx, ok := c.Request.Header["X-Kubecontext"]; ok {
			log.Debugf("Setting current context to: %s", ctx)
			ctxName = ctx[0]
			if err := data.SetContext(ctxName); err != nil {
				c.String(http.StatusInternalServerError, err.Error())
				return
			}
		}

		app, err := data.AppForCtx(ctxName)
		if err != nil {
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		c.Set(handlers.APP, app)

		c.Next()
	}
}

func NewRouter(abortWeb utils.ControlChan, data *objects.DataLayer, debug bool) *gin.Engine {
	var api *gin.Engine
	if debug {
		api = gin.New()
		api.Use(gin.Recovery())
	} else {
		api = gin.Default()
	}

	api.Use(contextSetter(data))
	api.Use(noCache)
	api.Use(errorHandler)

	configureStatic(api)
	configureRoutes(abortWeb, data, api)

	return api
}

func configureRoutes(abortWeb utils.ControlChan, data *objects.DataLayer, api *gin.Engine) {
	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
		c.Status(http.StatusAccepted)
	})

	api.GET("/status", func(c *gin.Context) {
		c.Header("X-Application-Name", "Helm Dashboard by Komodor.io") // to identify ourselves by ourselves
		c.IndentedJSON(http.StatusOK, data.GetStatus())
	})

	api.GET("/api/cache", func(c *gin.Context) {
		c.IndentedJSON(http.StatusOK, data.Cache)
	})

	api.DELETE("/api/cache", func(c *gin.Context) {
		err := data.Cache.Clear()
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		c.Status(http.StatusAccepted)
	})

	configureHelms(api.Group("/api/helm"), data)
	configureKubectls(api.Group("/api/kube"), data)
	configureScanners(api.Group("/api/scanners"), data)
}

func configureHelms(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.HelmHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}

	api.GET("/charts", h.GetReleases)
	api.DELETE("/charts", h.Uninstall)

	api.GET("/charts/history", h.History)
	api.GET("/charts/resources", h.Resources)
	api.GET("/charts/:section", h.GetInfoSection)
	api.POST("/charts/install", h.Install)
	api.POST("/charts/rollback", h.Rollback)

	api.GET("/repo", h.RepoList)
	api.POST("/repo", h.RepoAdd)
	api.DELETE("/repo", h.RepoDelete)
	api.GET("/repo/charts", h.RepoCharts)
	api.GET("/repo/latestver", h.RepoLatestVer)
	api.GET("/repo/versions", h.RepoVersions)
	api.POST("/repo/update", h.RepoUpdate)
	api.GET("/repo/values", h.RepoValues)
}

func configureKubectls(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.KubeHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}
	api.GET("/contexts", h.GetContexts)
	api.GET("/resources/:kind", h.GetResourceInfo)
	api.GET("/describe/:kind", h.Describe)
	api.GET("/namespaces", h.GetNameSpaces)
}

func configureStatic(api *gin.Engine) {
	fs := http.FS(staticFS)

	// TODO: enable HTTP client cache for it?

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

func configureScanners(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.ScannersHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}
	api.GET("", h.List)
	api.POST("/manifests", h.ScanDraftManifest)
	api.GET("/resource/:kind", h.ScanResource)
}
