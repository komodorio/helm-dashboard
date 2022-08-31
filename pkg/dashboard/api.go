package dashboard

import (
	"embed"
	"errors"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"path"
	"strconv"
)

//go:embed static/*
var staticFS embed.FS

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

func NewRouter(abortWeb ControlChan, data DataLayer) *gin.Engine {
	var api *gin.Engine
	if os.Getenv("DEBUG") == "" {
		api = gin.New()
		api.Use(gin.Recovery())
	} else {
		api = gin.Default()
	}

	api.Use(errorHandler)
	configureStatic(api)

	configureRoutes(abortWeb, data, api)
	return api
}

func configureRoutes(abortWeb ControlChan, data DataLayer, api *gin.Engine) {
	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})

	api.GET("/api/helm/charts", func(c *gin.Context) {
		res, err := data.ListInstalled()
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/kube/contexts", func(c *gin.Context) {
		res, err := data.ListContexts()
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/helm/charts/history", func(c *gin.Context) {
		cName := c.Query("chart")
		cNamespace := c.Query("namespace")
		if cName == "" {
			_ = c.AbortWithError(http.StatusBadRequest, errors.New("missing required query string parameter: chart"))
			return
		}

		res, err := data.ChartHistory(cNamespace, cName)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/helm/charts/manifest/diff", func(c *gin.Context) {
		cName := c.Query("chart")
		cNamespace := c.Query("namespace")
		if cName == "" {
			_ = c.AbortWithError(http.StatusBadRequest, errors.New("missing required query string parameter: chart"))
			return
		}

		cRev1, err := strconv.Atoi(c.Query("revision1"))
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		cRev2, err := strconv.Atoi(c.Query("revision2"))
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		res, err := data.RevisionManifestsDiff(cNamespace, cName, cRev1, cRev2)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

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
