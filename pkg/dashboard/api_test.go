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

func TestNoCache(t *testing.T) {
	w := httptest.NewRecorder()
	con := GetTestGinContext(w)
	noCache(con)
	assert.Equal(t, w.Header().Get("Cache-Control"), "no-cache")
}
