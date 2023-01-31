package dashboard

import (
	"context"
	"embed"
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	log "github.com/sirupsen/logrus"
	"html"
	"net/http"
	"os"
	"path"
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

func NewRouter(abortWeb context.CancelFunc, data *objects.DataLayer, debug bool) *gin.Engine {
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

func configureRoutes(abortWeb context.CancelFunc, data *objects.DataLayer, api *gin.Engine) {
	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb()
		c.Status(http.StatusAccepted)
	})

	api.GET("/status", func(c *gin.Context) {
		c.Header("X-Application-Name", "Helm Dashboard by Komodor.io") // to identify ourselves by ourselves
		c.IndentedJSON(http.StatusOK, data.GetStatus())
	})

	api.GET("/api/cache", func(c *gin.Context) { // TODO: included into OpenAPI or not?
		c.IndentedJSON(http.StatusOK, data.Cache)
	})

	api.DELETE("/api/cache", func(c *gin.Context) { // TODO: included into OpenAPI or not?
		err := data.Cache.Clear()
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		c.Status(http.StatusAccepted)
	})

	api.POST("/diff", func(c *gin.Context) { // TODO: included into OpenAPI or not?
		a := c.PostForm("a")
		b := c.PostForm("b")

		out := handlers.GetDiff(a, b, "current.yaml", "upgraded.yaml")
		c.Header("Content-Type", "text/plain")
		c.String(http.StatusOK, out)
	})

	api.GET("/api-docs", func(c *gin.Context) { // https://github.com/OAI/OpenAPI-Specification/search?q=api-docs
		c.Redirect(http.StatusFound, "static/api-docs.html")
	})

	configureHelms(api.Group("/api/helm"), data)
	configureKubectls(api.Group("/api/k8s"), data)
	configureScanners(api.Group("/api/scanners"), data)
}

func configureHelms(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.HelmHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}

	rels := api.Group("/releases")
	rels.GET("", h.GetReleases)
	rels.POST(":ns", h.Install)
	rels.POST(":ns/:name", h.Upgrade)
	rels.DELETE(":ns/:name", h.Uninstall)
	rels.GET(":ns/:name/history", h.History)
	rels.GET(":ns/:name/:section", h.GetInfoSection)
	rels.GET(":ns/:name/resources", h.Resources)
	rels.POST(":ns/:name/rollback", h.Rollback)
	rels.POST(":ns/:name/test", h.RunTests)

	repos := api.Group("/repositories")
	repos.GET("", h.RepoList)
	repos.POST("", h.RepoAdd)
	repos.GET("/:name", h.RepoCharts)
	repos.POST("/:name", h.RepoUpdate)
	repos.DELETE("/:name", h.RepoDelete)
	repos.GET("/latestver", h.RepoLatestVer) // TODO: use /versions in client insted and remove this?
	repos.GET("/versions", h.RepoVersions)
	repos.GET("/values", h.RepoValues)
}

func configureKubectls(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.KubeHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}
	api.GET("/contexts", h.GetContexts)
	api.GET("/:kind/get", h.GetResourceInfo)
	api.GET("/:kind/describe", h.Describe)
	api.GET("/:kind/list", h.GetNameSpaces)
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

func configureScanners(api *gin.RouterGroup, data *objects.DataLayer) {
	h := handlers.ScannersHandler{
		Contexted: &handlers.Contexted{
			Data: data,
		},
	}
	api.GET("", h.List)
	api.POST("/manifests", h.ScanManifest)
	api.GET("/resource/:kind", h.ScanResource)
}
