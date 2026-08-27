package objects

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestQueryArtifactHub_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"packages": [{"package_id": "p1", "name": "nginx", "version": "1.0.0"}]}`)
	}))
	defer ts.Close()

	t.Setenv("HD_ARTIFACT_HUB_URL", ts.URL)

	res, err := QueryArtifactHub("nginx")
	if err != nil {
		t.Fatalf("QueryArtifactHub failed: %v", err)
	}
	if len(res) != 1 {
		t.Fatalf("expected 1 result, got %d", len(res))
	}
	if res[0].Name != "nginx" {
		t.Errorf("expected package name 'nginx', got %q", res[0].Name)
	}
}

func TestQueryArtifactHub_ErrorStatus(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "server error", http.StatusInternalServerError)
	}))
	defer ts.Close()

	t.Setenv("HD_ARTIFACT_HUB_URL", ts.URL)

	_, err := QueryArtifactHub("nginx")
	if err == nil {
		t.Fatalf("expected error on HTTP 500, got nil")
	}
}
