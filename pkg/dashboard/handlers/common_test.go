package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/v2/pkg/dashboard/objects"
)

func TestGetApp_MissingContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	h := &Contexted{}
	app := h.GetApp(c)
	if app != nil {
		t.Errorf("expected nil app when context is empty")
	}
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestGetApp_InvalidType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	c.Set(APP, "not-an-application-pointer")

	h := &Contexted{}
	app := h.GetApp(c)
	if app != nil {
		t.Errorf("expected nil app when context has invalid type")
	}
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestGetApp_Valid(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	expectedApp := &objects.Application{}
	c.Set(APP, expectedApp)

	h := &Contexted{}
	app := h.GetApp(c)
	if app != expectedApp {
		t.Errorf("expected matching app pointer")
	}
}
