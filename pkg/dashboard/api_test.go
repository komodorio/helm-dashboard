package dashboard

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/handlers"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
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
