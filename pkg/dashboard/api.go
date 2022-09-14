package dashboard

import (
	"embed"
	"errors"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	v12 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"net/http"
	"os"
	"path"
	"strconv"
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

func NewRouter(abortWeb ControlChan, data *DataLayer) *gin.Engine {
	var api *gin.Engine
	if os.Getenv("DEBUG") == "" {
		api = gin.New()
		api.Use(gin.Recovery())
	} else {
		api = gin.Default()
	}

	api.Use(noCache)
	api.Use(contextSetter(data))
	api.Use(errorHandler)
	configureStatic(api)

	configureRoutes(abortWeb, data, api)
	return api
}

func configureRoutes(abortWeb ControlChan, data *DataLayer, api *gin.Engine) {
	// server shutdown handler
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})

	configureHelms(api, data)
	configureKubectls(api, data)
}

func configureHelms(api *gin.Engine, data *DataLayer) {
	api.GET("/api/helm/charts", func(c *gin.Context) {
		res, err := data.ListInstalled()
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.DELETE("/api/helm/charts", func(c *gin.Context) {
		qp, err := getQueryProps(c, false)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		err = data.UninstallChart(qp.Namespace, qp.Name)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.Redirect(http.StatusFound, "/")
	})

	api.POST("/api/helm/charts/rollback", func(c *gin.Context) {
		qp, err := getQueryProps(c, true)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		err = data.Revert(qp.Namespace, qp.Name, qp.Revision)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.Redirect(http.StatusFound, "/")
	})

	api.GET("/api/helm/charts/history", func(c *gin.Context) {
		qp, err := getQueryProps(c, false)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		res, err := data.ChartHistory(qp.Namespace, qp.Name)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/helm/charts/resources", func(c *gin.Context) {
		qp, err := getQueryProps(c, true)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		res, err := data.RevisionManifestsParsed(qp.Namespace, qp.Name, qp.Revision)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/helm/charts/:section", func(c *gin.Context) {
		qp, err := getQueryProps(c, true)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		flag := c.Query("flag") == "true"
		rDiff := c.Query("revisionDiff")
		res, err := handleGetSection(data, c.Param("section"), rDiff, qp, flag)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.String(http.StatusOK, res)
	})
}

func handleGetSection(data *DataLayer, section string, rDiff string, qp *QueryProps, flag bool) (string, error) {
	sections := map[string]SectionFn{
		"manifests": data.RevisionManifests,
		"values":    data.RevisionValues,
		"notes":     data.RevisionNotes,
	}

	functor, found := sections[section]
	if !found {
		return "", errors.New("unsupported section: " + section)
	}

	if rDiff != "" {
		cRevDiff, err := strconv.Atoi(rDiff)
		if err != nil {
			return "", err
		}

		ext := ".yaml"
		if section == "notes" {
			ext = ".txt"
		}

		res, err := RevisionDiff(functor, ext, qp.Namespace, qp.Name, cRevDiff, qp.Revision, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	} else {
		res, err := functor(qp.Namespace, qp.Name, qp.Revision, flag)
		if err != nil {
			return "", err
		}
		return res, nil
	}
}

func configureKubectls(api *gin.Engine, data *DataLayer) {
	api.GET("/api/kube/contexts", func(c *gin.Context) {
		res, err := data.ListContexts()
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/kube/resources/:kind", func(c *gin.Context) {
		qp, err := getQueryProps(c, false)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		res, err := data.GetResource(qp.Namespace, &GenericResource{
			TypeMeta:   v1.TypeMeta{Kind: c.Param("kind")},
			ObjectMeta: v1.ObjectMeta{Name: qp.Name},
		})
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		if res.Status.Phase == "Active" || res.Status.Phase == "Error" {
			_ = res.Name + ""
		} else if res.Status.Phase == "" && len(res.Status.Conditions) > 0 {
			res.Status.Phase = v12.CarpPhase(res.Status.Conditions[len(res.Status.Conditions)-1].Type)
			res.Status.Message = res.Status.Conditions[len(res.Status.Conditions)-1].Message
			res.Status.Reason = res.Status.Conditions[len(res.Status.Conditions)-1].Reason
			if res.Status.Conditions[len(res.Status.Conditions)-1].Status == "False" {
				res.Status.Phase = "Not" + res.Status.Phase
			}
		} else if res.Status.Phase == "" {
			res.Status.Phase = "Exists"
		}

		c.IndentedJSON(http.StatusOK, res)
	})

	api.GET("/api/kube/describe/:kind", func(c *gin.Context) {
		qp, err := getQueryProps(c, false)
		if err != nil {
			_ = c.AbortWithError(http.StatusBadRequest, err)
			return
		}

		res, err := data.DescribeResource(qp.Namespace, c.Param("kind"), qp.Name)
		if err != nil {
			_ = c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		c.String(http.StatusOK, res)
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

func contextSetter(data *DataLayer) gin.HandlerFunc {
	return func(c *gin.Context) {
		if context, ok := c.Request.Header["X-Kubecontext"]; ok {
			log.Debugf("Setting current context to: %s", context)
			data.KubeContext = context[0]
		}
		c.Next()
	}
}

type QueryProps struct {
	Namespace string
	Name      string
	Revision  int
}

func getQueryProps(c *gin.Context, revRequired bool) (*QueryProps, error) {
	qp := QueryProps{}

	qp.Namespace = c.Query("namespace")
	qp.Name = c.Query("name")
	if qp.Name == "" {
		return nil, errors.New("missing required query string parameter: name")
	}

	cRev, err := strconv.Atoi(c.Query("revision"))
	if err != nil && revRequired {
		return nil, err
	}
	qp.Revision = cRev

	return &qp, nil
}
