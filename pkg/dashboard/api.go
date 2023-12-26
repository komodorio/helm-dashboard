package dashboard

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/pkg/frontend"
	log "github.com/sirupsen/logrus"
)

const (
	PassportAK  = "oNUVPchfxwPDnuyx"
	PassportSK  = ""
	PassportURL = "passport.k8s.corp.autra.tech"
	kHelmToken  = "X-Helm-Token"
)

type userinfoResponse struct {
	Error   int    `json:"error"`
	Message string `json:"message,omitempty"`
	User    struct {
		Name   string `json:"name"`
		Email  string `json:"email"`
		Avatar string `json:"avatar"`
		UserID string `json:"user_id"`
	}
}

type LoginResponse struct {
	Error       int    `json:"error"`
	Description string `json:"description"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	Token       string `json:"token"`
}

type tokenResponse struct {
	Error            int    `json:"error,omitempty"`
	ErrorDescription string `json:"error_description,omitempty"`
	// Successful response fields
	UserID      string `json:"user_id,omitempty"`
	AccessToken string `json:"access_token,omitempty"`
	ExpiresIn   int    `json:"expires_in,omitempty"`
}

func noCache(c *gin.Context) {
	if c.GetHeader("Cache-Control") == "" { // default policy is not to cache
		c.Header("Cache-Control", "no-cache")
	}

	c.Next()
}

func allowCORS(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "*")
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

// Middleware for CORS
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "*")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}

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
	api.Use(corsMiddleware())

	if os.Getenv("HD_CORS") != "" {
		api.Use(allowCORS)
	}

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

	api.GET("/loginlink", func(c *gin.Context) {
		redirect_uri, state := c.Query("redirect_uri"), c.Query("state")
		fmt.Println(redirect_uri)
		fmt.Println(state)
		str := GetAuthURL(redirect_uri, state)
		c.JSON(http.StatusOK, str)
	})

	api.GET("/callback", Login)

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
	fs := http.FS(frontend.StaticFS)

	api.GET("/", func(c *gin.Context) {
		c.FileFromFS("/dist/", fs)
	})

	api.GET("/assets/*filepath", func(c *gin.Context) {
		c.FileFromFS(path.Join("dist", c.Request.URL.Path), fs)
	})

	api.GET("/static/*filepath", func(c *gin.Context) {
		c.FileFromFS(path.Join("dist", c.Request.URL.Path), fs)
	})
}

func GetAuthURL(redirect_uri string, state string) string {
	v := url.Values{}
	v.Set("client_id", PassportAK)
	v.Add("grant_type", "authorization_code")
	v.Add("redirect_uri", redirect_uri)
	v.Add("state", state)
	u := &url.URL{
		Scheme:   "http",
		Host:     PassportURL,
		RawQuery: v.Encode(),
	}
	return u.String()
}

func Login(c *gin.Context) {
	code := c.Query("code")
	token, err := ExchangeToken(code)
	rsp := LoginResponse{}
	if err != nil {
		rsp.Error = -1
		rsp.Description = err.Error()
		c.JSON(http.StatusInternalServerError, rsp)
	}
	email, name, _, err := GetUserInfo(token)
	if err != nil {
		rsp.Error = -1
		rsp.Description = err.Error()
		c.JSON(http.StatusInternalServerError, rsp)
	}
	rsp.Email = email
	rsp.Name = name
	c.SetCookie(kHelmToken, token, 3600*24*30, "/", "", false, false)
	c.Redirect(http.StatusFound, "/")
}

func GetUserInfo(token string) (string, string, string, error) {
	url := "http://" + PassportURL + "/openapi/userinfo"
	method := http.MethodGet
	client := &http.Client{}
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return "", "", "", err
	}
	req.Header.Add("Authorization", "Bearer "+token)
	res, err := client.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", "", "", err
	}
	var rsp userinfoResponse
	err = json.Unmarshal(body, &rsp)
	if err != nil {
		return "", "", "", err
	}
	if res.StatusCode == 200 {
		return rsp.User.Email, rsp.User.Name, rsp.User.UserID, nil
	}
	return "", "", "", fmt.Errorf(rsp.Message)
}

func ExchangeToken(code string) (string, error) {
	url := "http://" + PassportURL + "/oauth2/token"
	method := http.MethodPost
	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	_ = writer.WriteField("code", code)
	_ = writer.WriteField("grant_type", "authorization_code")
	_ = writer.WriteField("client_id", PassportAK)
	_ = writer.WriteField("client_secret", PassportSK)
	err := writer.Close()
	if err != nil {
		return "", err
	}
	client := &http.Client{}
	req, err := http.NewRequest(method, url, payload)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	var rsp tokenResponse
	err = json.Unmarshal(body, &rsp)
	if err != nil {
		return "", err
	}
	if res.StatusCode == 200 {
		return rsp.AccessToken, nil
	}
	return "", fmt.Errorf(rsp.ErrorDescription)
}
