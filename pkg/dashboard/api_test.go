package dashboard

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/cli"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

var inMemStorage *storage.Storage
var repoFile string

func TestMain(m *testing.M) { // fixture to set logging level via env variable
	if utils.EnvAsBool("DEBUG", false) {
		log.SetLevel(log.DebugLevel)
		log.Debugf("Set logging level")
	}

	inMemStorage = storage.Init(driver.NewMemory())
	d, err := os.MkdirTemp("", "helm")
	if err != nil {
		panic(err)
	}
	repoFile = filepath.Join(d, "repositories.yaml")

	m.Run()
	inMemStorage = nil
	repoFile = ""
}

func GetTestGinContext(w *httptest.ResponseRecorder) *gin.Context {
	gin.SetMode(gin.TestMode)

	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = &http.Request{
		Header: make(http.Header),
	}

	return ctx
}

func TestNoCacheMiddleware(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)
	noCache(con)
	assert.Equal(t, w.Header().Get("Cache-Control"), "no-cache")
}

func TestEnableCacheControl(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)

	// Sets deafault policy to `no-cache`
	noCache(con)

	h := handlers.HelmHandler{
		Contexted: &handlers.Contexted{
			Data: &objects.DataLayer{},
		},
	}
	h.EnableClientCache(con)
	assert.Equal(t, w.Header().Get("Cache-Control"), "max-age=43200")
}

func TestConfigureStatic(t *testing.T) {
	w := httptest.NewRecorder()

	req, err := http.NewRequest("GET", "/", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create an API Engine
	api := gin.Default()

	// Configure static routes
	configureStatic(api)

	// Start the server
	api.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestConfigureRoutes(t *testing.T) {
	w := httptest.NewRecorder()

	req, err := http.NewRequest("GET", "/status", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a API Engine
	api := gin.Default()

	// Required arguments for route configuration
	abortWeb := func() {}
	data, err := objects.NewDataLayer([]string{"TestSpace"}, "T-1", NewHelmConfig, false)

	if err != nil {
		t.Fatal(err)
	}

	// Configure routes to API engine
	configureRoutes(abortWeb, data, api)

	// Start the server
	api.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestContextSetter(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)

	// Required arguments
	data, err := objects.NewDataLayer([]string{"TestSpace"}, "T-1", NewHelmConfig, false)

	if err != nil {
		t.Fatal(err)
	}

	// Set the context
	ctxHandler := contextSetter(data)
	ctxHandler(con)

	appName, exists := con.Get("app")

	if !exists {
		t.Fatal("Value app doesn't exist in context")
	}

	tmp := handlers.Contexted{Data: data}

	assert.Equal(t, appName, tmp.GetApp(con))
}

func TestNewRouter(t *testing.T) {
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/status", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Required arguemnets
	abortWeb := func() {}
	data, err := objects.NewDataLayer([]string{"TestSpace"}, "T-1", NewHelmConfig, false)

	if err != nil {
		t.Fatal(err)
	}

	// Create a new router with the function
	newRouter := NewRouter(abortWeb, data, false)

	newRouter.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestConfigureKubectls(t *testing.T) {
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/api/kube/contexts", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Required arguemnets
	data, err := objects.NewDataLayer([]string{"TestSpace"}, "T-1", NewHelmConfig, false)

	if err != nil {
		t.Fatal(err)
	}

	apiEngine := gin.Default()

	// Required middleware for kubectl api configuration
	apiEngine.Use(contextSetter(data))

	configureKubectls(apiEngine.Group("/api/kube"), data)

	apiEngine.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestE2E(t *testing.T) {
	// Initialize data layer
	data, err := objects.NewDataLayer([]string{""}, "0.0.0-test", getFakeHelmConfig, false)
	assert.NilError(t, err)

	// Create a new router with the function
	abortWeb := func() {}
	newRouter := NewRouter(abortWeb, data, false)

	// initially, we don't have any releases
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/api/helm/releases", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), "[]")

	// initially, we don't have any repositories
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/repositories", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), "[]")

	// then we add one repository
	w = httptest.NewRecorder()
	form := url.Values{}
	form.Add("name", "komodorio")
	form.Add("url", "https://helm-charts.komodor.io")
	req, err = http.NewRequest("POST", "/api/helm/repositories", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusNoContent)
	assert.Equal(t, w.Body.String(), "")

	// now, we have one repo
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/repositories", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), `[
    {
        "name": "komodorio",
        "url": "https://helm-charts.komodor.io"
    }
]`)

	// what's the latest version of that chart
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/repositories/latestver?name=helm-dashboard", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)

	// generate template for potential release
	w = httptest.NewRecorder()
	form = url.Values{}
	form.Add("preview", "true")
	form.Add("name", "release1")
	form.Add("chart", "komodorio/helm-dashboard")
	req, err = http.NewRequest("POST", "/api/helm/releases/test1", strings.NewReader(form.Encode()))
	assert.NilError(t, err)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)

	// install the release
	w = httptest.NewRecorder()
	form = url.Values{}
	form.Add("name", "release1")
	form.Add("chart", "komodorio/helm-dashboard")
	req, err = http.NewRequest("POST", "/api/helm/releases/test1", strings.NewReader(form.Encode()))
	assert.NilError(t, err)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// get list of releases
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/releases", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	t.Logf("Release: %s", w.Body.String())
	//assert.Equal(t, w.Body.String(), "[]")

	// upgrade/reconfigure release
	w = httptest.NewRecorder()
	form = url.Values{}
	form.Add("chart", "komodorio/helm-dashboard")
	form.Add("values", "dashboard:\n  allowWriteActions: true\n")
	req, err = http.NewRequest("POST", "/api/helm/releases/test1/release1", strings.NewReader(form.Encode()))
	assert.NilError(t, err)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// get history of revisions for release
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/releases/test1/release1/history", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	t.Logf("Revs: %s", w.Body.String())
	//assert.Equal(t, w.Body.String(), "[]")

	// get values for revision
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/releases/test1/release1/values?revision=2&userDefined=true", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	//assert.Equal(t, w.Body.String(), "[]")

	// rollback
	w = httptest.NewRecorder()
	form = url.Values{}
	form.Add("revision", "1")
	req, err = http.NewRequest("POST", "/api/helm/releases/test1/release1/rollback", strings.NewReader(form.Encode()))
	assert.NilError(t, err)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// get manifest diff for release
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/releases/test1/release1/manifests?revision=1&revisionDiff=2", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	//assert.Equal(t, w.Body.String(), "[]")

	// delete repo
	w = httptest.NewRecorder()
	req, err = http.NewRequest("DELETE", "/api/helm/repositories/komodorio", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusNoContent)

	// reconfigure release without repo connection
	w = httptest.NewRecorder()
	form = url.Values{}
	form.Add("chart", "komodorio/helm-dashboard")
	form.Add("values", "dashboard:\n  allowWriteActions: false\n")
	req, err = http.NewRequest("POST", "/api/helm/releases/test1/release1", strings.NewReader(form.Encode()))
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	assert.Equal(t, w.Code, http.StatusAccepted)
	t.Logf("Upgraded: %s", w.Body.String())

	// uninstall
	w = httptest.NewRecorder()
	req, err = http.NewRequest("DELETE", "/api/helm/releases/test1/release1", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// check we don't have releases again
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/releases", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), "[]")
}

func getFakeHelmConfig(settings *cli.EnvSettings, _ string) (*action.Configuration, error) {
	settings.RepositoryConfig = repoFile

	registryClient, err := registry.NewClient()
	if err != nil {
		return nil, err
	}

	return &action.Configuration{
		Releases:       inMemStorage,
		KubeClient:     &kubefake.FailingKubeClient{PrintingKubeClient: kubefake.PrintingKubeClient{Out: os.Stderr}},
		Capabilities:   chartutil.DefaultCapabilities,
		RegistryClient: registryClient,
		Log:            log.Infof,
	}, nil
}
