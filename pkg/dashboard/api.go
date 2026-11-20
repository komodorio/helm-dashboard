package dashboard

import (
	"context"
	"html"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/v2/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/v2/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/v2/pkg/frontend"
	log "github.com/sirupsen/logrus"
)

func noCache(c *gin.Context) {
	if c.GetHeader("Cache-Control") == "" { // default policy is not to cache
		c.Header("Cache-Control", "no-cache")
	}

	c.Next()
}

// parseCORSAllowlist reads HD_CORS as a comma-separated list of exact origins
// (e.g. "http://localhost:5173,https://helm.example.com"). It is opt-in and never
// wildcards: cross-origin browser access is allowed only for listed origins.
func parseCORSAllowlist(env string) map[string]bool {
	allowed := map[string]bool{}
	for _, o := range strings.Split(env, ",") {
		if o = strings.TrimSpace(o); o != "" {
			allowed[o] = true
		}
	}
	return allowed
}

// corsAllowlist reflects CORS headers only for origins explicitly listed in HD_CORS.
// With HD_CORS unset the API is same-origin only, which is what the bundled UI,
// the CLI and curl use. This replaces the former unconditional wildcard that let
// any website read the API's responses in a victim's browser.
func corsAllowlist(allowed map[string]bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if origin := c.GetHeader("Origin"); origin != "" && allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "X-Kubecontext, Content-Type")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// sameOriginGuard rejects state-changing requests that are not same-origin, which
// stops a foreign web page from forging install/upgrade/uninstall/repo-add calls
// against a victim's locally running dashboard (CSRF). It relies first on the
// browser-set Sec-Fetch-Site header, then falls back to an Origin/Referer host
// match for older browsers. Non-browser clients (no Origin/Referer/Sec-Fetch-Site)
// are unaffected.
func sameOriginGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch:
			if !isSameOrigin(c) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "cross-origin request rejected"})
				return
			}
		}
		c.Next()
	}
}

func isSameOrigin(c *gin.Context) bool {
	switch c.GetHeader("Sec-Fetch-Site") {
	case "same-origin", "none":
		return true
	case "same-site", "cross-site":
		return false
	}

	for _, h := range []string{c.GetHeader("Origin"), c.GetHeader("Referer")} {
		if h == "" {
			continue
		}
		u, err := url.Parse(h)
		return err == nil && u.Host == c.Request.Host
	}

	// No browser-origin signal at all: a non-browser client such as the CLI or curl.
	return true
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

func NewRouter(abortWeb context.CancelFunc, data *objects.DataLayer, debug bool, basePath string) *gin.Engine {
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
	api.Use(corsAllowlist(parseCORSAllowlist(os.Getenv("HD_CORS"))))
	api.Use(sameOriginGuard())

	root := api.Group(basePath)
	configureStatic(root)
	configureRoutes(abortWeb, data, root)

	return api
}

func configureRoutes(abortWeb context.CancelFunc, data *objects.DataLayer, api *gin.RouterGroup) {
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
	rels.GET(":ns/:name/images", h.Images)
	rels.GET(":ns/:name/relations", h.Relations)
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

func configureStatic(api *gin.RouterGroup) {
	fs := http.FS(frontend.StaticFS)

	api.GET("/", func(c *gin.Context) {
		c.FileFromFS("/dist/", fs)
	})

	// files that index.html references from the dist root
	for _, name := range []string{"logo.svg", "analytics.js"} {
		api.GET("/"+name, func(c *gin.Context) {
			c.FileFromFS(path.Join("dist", name), fs)
		})
	}

	api.GET("/assets/*filepath", func(c *gin.Context) {
		c.FileFromFS(path.Join("dist", "assets", c.Param("filepath")), fs)
	})

	api.GET("/static/*filepath", func(c *gin.Context) {
		c.FileFromFS(path.Join("dist", "static", c.Param("filepath")), fs)
	})
}
