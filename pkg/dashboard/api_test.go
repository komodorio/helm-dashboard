package dashboard

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
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

func TestNoCacheBeforeSetting(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)
	noCache(con)
	assert.Equal(t, w.Header().Get("Cache-Control"), "no-cache")
}

func TestNoCacheAfterSetting(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)

	// Set value to default value defined in `EnableClientCache` (reference to below file)
	// https://github.com/komodorio/helm-dashboard/blob/features-1.0/pkg/dashboard/handlers/common.go
	w.Header().Set("Cache-Control", "max-age=43200")
	assert.Equal(t, w.Header().Get("Cache-Control"), "max-age=43200")

	// Now manipulate the value with `noCache()`
	noCache(con)
	assert.Equal(t, w.Header().Get("Cache-Control"), "no-cache")
}
