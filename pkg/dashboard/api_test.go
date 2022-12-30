package dashboard

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"gotest.tools/v3/assert"
)

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

	// Create a API Engine
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
	data := &objects.DataLayer{
		StatusInfo: &objects.StatusInfo{},
		Cache:      objects.NewCache(),
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
	data, _ := objects.NewDataLayer("TestSpace", "T-1", objects.NewHelmConfig)

	// Set the context
	ctxHandler := contextSetter(data)
	ctxHandler(con)

	appName, _ := con.Get("app")
	tmp := handlers.Contexted{Data: data}

	assert.Equal(t, appName, tmp.GetApp(con))
}
