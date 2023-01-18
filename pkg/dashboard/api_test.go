package dashboard

import (
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
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var inMemStorage *storage.Storage
var repoFile string

func TestMain(m *testing.M) { // fixture to set logging level via env variable
	if os.Getenv("DEBUG") != "" {
		log.SetLevel(log.DebugLevel)
		log.Debugf("Set logging level")
	}

	inMemStorage = storage.Init(driver.NewMemory())
	d, err := ioutil.TempDir("", "helm")
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

	// Required arguements for route configuration
	abortWeb := make(utils.ControlChan)
	data, err := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

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

	// Required arguements
	data, err := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

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
	abortWeb := make(utils.ControlChan)
	data, err := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

	if err != nil {
		t.Fatal(err)
	}

	// Create a new router with the function
	newRouter := NewRouter(abortWeb, data, false)

	newRouter.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestConfigureScanners(t *testing.T) {
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/api/scanners", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Required arguemnets
	data, err := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

	if err != nil {
		t.Fatal(err)
	}

	apiEngine := gin.Default()

	configureScanners(apiEngine.Group("/api/scanners"), data)

	apiEngine.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusOK)
}

func TestConfigureKubectls(t *testing.T) {
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/api/kube/contexts", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Required arguemnets
	data, err := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

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
	data, err := objects.NewDataLayer("", "0.0.0-test", getFakeHelmConfig)
	assert.NilError(t, err)

	// Create a new router with the function
	abortWeb := make(utils.ControlChan)
	newRouter := NewRouter(abortWeb, data, false)

	// initially, we don't have any releases
	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/api/helm/charts", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), "[]")

	// initially, we don't have any repositories
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/repo", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), "[]")

	// then we add one repository
	w = httptest.NewRecorder()
	form := url.Values{}
	form.Add("name", "komodorio")
	form.Add("url", "https://helm-charts.komodor.io")
	req, err = http.NewRequest("POST", "/api/helm/repo", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusNoContent)
	assert.Equal(t, w.Body.String(), "")

	// now, we have one repo
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/repo", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	assert.Equal(t, w.Body.String(), `[
    {
        "name": "komodorio",
        "url": "https://helm-charts.komodor.io"
    }
]`)

	// generate template for potential release
	w = httptest.NewRecorder()
	req, err = http.NewRequest("POST", "/api/helm/charts/install?flag=true&initial=true&namespace=test1&name=release1&chart=komodorio/helm-dashboard", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// install the release
	w = httptest.NewRecorder()
	req, err = http.NewRequest("POST", "/api/helm/charts/install?initial=true&namespace=test1&name=release1&chart=komodorio/helm-dashboard", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// get list of releases
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/charts", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusOK)
	//assert.Equal(t, w.Body.String(), "[]")

	// upgrade/reconfigure release

	// get history of revisions for release

	// get manifest diff for release

	// rollback
	w = httptest.NewRecorder()
	req, err = http.NewRequest("POST", "/api/helm/charts/rollback?namespace=test1&name=release1&revision=1", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// uninstall
	w = httptest.NewRecorder()
	req, err = http.NewRequest("DELETE", "/api/helm/charts?namespace=test1&name=release1", nil)
	assert.NilError(t, err)
	newRouter.ServeHTTP(w, req)
	assert.Equal(t, w.Code, http.StatusAccepted)

	// check we don't have releases again
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/api/helm/charts", nil)
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
