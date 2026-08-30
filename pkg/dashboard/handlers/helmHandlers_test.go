package handlers

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/release"
	helmtime "helm.sh/helm/v3/pkg/time"
)

func TestHReleaseToJSON(t *testing.T) {
	now := helmtime.Now()
	rel := &release.Release{
		Name:      "my-release",
		Namespace: "default",
		Version:   2,
		Info: &release.Info{
			Status:       release.StatusDeployed,
			LastDeployed: now,
			Description:  "Install complete",
		},
		Chart: &chart.Chart{
			Metadata: &chart.Metadata{
				Name:        "nginx",
				Version:     "1.2.3",
				AppVersion:  "1.21.0",
				Icon:        "https://example.com/icon.png",
				Description: "Nginx web server",
			},
		},
	}

	elem := HReleaseToJSON(rel)
	if elem == nil {
		t.Fatal("expected non-nil ReleaseElement")
	}

	if elem.Name != "my-release" {
		t.Errorf("expected Name 'my-release', got %s", elem.Name)
	}
	if elem.Namespace != "default" {
		t.Errorf("expected Namespace 'default', got %s", elem.Namespace)
	}
	if elem.Revision != "2" {
		t.Errorf("expected Revision '2', got %s", elem.Revision)
	}
	if elem.Status != release.StatusDeployed {
		t.Errorf("expected Status %s, got %s", release.StatusDeployed, elem.Status)
	}
	if elem.Chart != "nginx-1.2.3" {
		t.Errorf("expected Chart 'nginx-1.2.3', got %s", elem.Chart)
	}
	if elem.ChartName != "nginx" {
		t.Errorf("expected ChartName 'nginx', got %s", elem.ChartName)
	}
	if elem.ChartVersion != "1.2.3" {
		t.Errorf("expected ChartVersion '1.2.3', got %s", elem.ChartVersion)
	}
	if elem.AppVersion != "1.21.0" {
		t.Errorf("expected AppVersion '1.21.0', got %s", elem.AppVersion)
	}
	if elem.Icon != "https://example.com/icon.png" {
		t.Errorf("expected Icon 'https://example.com/icon.png', got %s", elem.Icon)
	}
	if elem.Description != "Nginx web server" {
		t.Errorf("expected Description 'Nginx web server', got %s", elem.Description)
	}
}

func TestHReleaseToHistElem(t *testing.T) {
	now := helmtime.Now()
	rel := &release.Release{
		Name:      "test-app",
		Namespace: "prod",
		Version:   3,
		Info: &release.Info{
			Status:       release.StatusSuperseded,
			LastDeployed: now,
			Description:  "Upgrade complete",
		},
		Chart: &chart.Chart{
			Metadata: &chart.Metadata{
				Name:        "redis",
				Version:     "0.5.0",
				AppVersion:  "6.2",
				Description: "Redis chart",
			},
		},
		Hooks: []*release.Hook{
			{
				Name:   "test-hook",
				Events: []release.HookEvent{release.HookTest},
			},
		},
	}

	hist := HReleaseToHistElem(rel)
	if hist == nil {
		t.Fatal("expected non-nil HistoryElement")
	}

	if hist.Revision != 3 {
		t.Errorf("expected Revision 3, got %d", hist.Revision)
	}
	if hist.Status != release.StatusSuperseded {
		t.Errorf("expected Status %s, got %s", release.StatusSuperseded, hist.Status)
	}
	if hist.Chart != "redis-0.5.0" {
		t.Errorf("expected Chart 'redis-0.5.0', got %s", hist.Chart)
	}
	if hist.ChartName != "redis" {
		t.Errorf("expected ChartName 'redis', got %s", hist.ChartName)
	}
	if hist.ChartVer != "0.5.0" {
		t.Errorf("expected ChartVer '0.5.0', got %s", hist.ChartVer)
	}
	if hist.AppVersion != "6.2" {
		t.Errorf("expected AppVersion '6.2', got %s", hist.AppVersion)
	}
	if hist.Description != "Upgrade complete" {
		t.Errorf("expected Description 'Upgrade complete', got %s", hist.Description)
	}
	if !hist.HasTests {
		t.Errorf("expected HasTests to be true")
	}
}

func TestReleaseHasTests(t *testing.T) {
	relNoTests := &release.Release{
		Hooks: []*release.Hook{
			{
				Name:   "pre-install",
				Events: []release.HookEvent{release.HookPreInstall},
			},
		},
	}
	if releaseHasTests(relNoTests) {
		t.Errorf("expected releaseHasTests to be false when no test hook exists")
	}

	relWithTests := &release.Release{
		Hooks: []*release.Hook{
			{
				Name:   "test-connection",
				Events: []release.HookEvent{release.HookTest},
			},
		},
	}
	if !releaseHasTests(relWithTests) {
		t.Errorf("expected releaseHasTests to be true when test hook exists")
	}

	relEmpty := &release.Release{}
	if releaseHasTests(relEmpty) {
		t.Errorf("expected releaseHasTests to be false for empty release")
	}
}

func TestGetDiff(t *testing.T) {
	manifest1 := "replicas: 1\nimage: nginx:1.20\n"
	manifest2 := "replicas: 2\nimage: nginx:1.21\n"

	diff := GetDiff(manifest1, manifest2, "rev1.yaml", "rev2.yaml")
	if diff == "" {
		t.Fatal("expected non-empty diff")
	}

	if !strings.Contains(diff, "-replicas: 1") || !strings.Contains(diff, "+replicas: 2") {
		t.Errorf("diff does not contain expected changes: %s", diff)
	}
	if !strings.Contains(diff, "rev1.yaml") || !strings.Contains(diff, "rev2.yaml") {
		t.Errorf("diff does not contain file headers: %s", diff)
	}
}

func TestGetDiff_Identical(t *testing.T) {
	manifest := "replicas: 1\nimage: nginx:1.20\n"
	diff := GetDiff(manifest, manifest, "rev1.yaml", "rev2.yaml")
	if strings.TrimSpace(diff) != "" {
		t.Errorf("expected empty diff for identical inputs, got: %s", diff)
	}
}

func TestRevisionDiff(t *testing.T) {
	functor := func(r *release.Release, flag bool) (string, error) {
		return r.Manifest, nil
	}

	r1 := &release.Release{
		Version:  1,
		Manifest: "kind: Service\nport: 80\n",
	}
	r2 := &release.Release{
		Version:  2,
		Manifest: "kind: Service\nport: 8080\n",
	}

	diff, err := RevisionDiff(functor, ".yaml", r1, r2, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(diff, "-port: 80") || !strings.Contains(diff, "+port: 8080") {
		t.Errorf("unexpected diff output: %s", diff)
	}

	// Test nil input handling
	diffNil, errNil := RevisionDiff(functor, ".yaml", nil, r2, false)
	if errNil != nil || diffNil != "" {
		t.Errorf("expected empty diff and nil error on nil release, got diff: '%s', err: %v", diffNil, errNil)
	}
}

func TestRepoChartElementJSON(t *testing.T) {
	elem := RepoChartElement{
		Name:               "prometheus",
		Version:            "15.0.0",
		AppVersion:         "v2.30.0",
		Description:        "Prometheus monitoring",
		InstalledNamespace: "monitoring",
		InstalledName:      "prom-stack",
		Repository:         "prometheus-community",
		URLs:               []string{"https://prometheus-community.github.io/helm-charts"},
		IsSuggestedRepo:    false,
	}

	data, err := json.Marshal(elem)
	if err != nil {
		t.Fatalf("failed to marshal RepoChartElement: %v", err)
	}

	var parsed RepoChartElement
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal RepoChartElement: %v", err)
	}

	if parsed.Name != elem.Name || parsed.Version != elem.Version || parsed.InstalledNamespace != elem.InstalledNamespace {
		t.Errorf("mismatch in parsed RepoChartElement: %+v vs %+v", parsed, elem)
	}
}

func TestReleaseElementJSON(t *testing.T) {
	now := helmtime.Date(2026, time.January, 15, 10, 0, 0, 0, time.UTC)
	elem := ReleaseElement{
		Name:         "grafana",
		Namespace:    "monitoring",
		Revision:     "1",
		Updated:      now,
		Status:       release.StatusDeployed,
		Chart:        "grafana-6.50.0",
		ChartName:    "grafana",
		ChartVersion: "6.50.0",
		AppVersion:   "9.0.0",
		Icon:         "https://example.com/icon.svg",
		Description:  "Grafana dashboard",
	}

	data, err := json.Marshal(elem)
	if err != nil {
		t.Fatalf("failed to marshal ReleaseElement: %v", err)
	}

	var parsed ReleaseElement
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal ReleaseElement: %v", err)
	}

	if parsed.Name != "grafana" || parsed.Chart != "grafana-6.50.0" || parsed.Status != release.StatusDeployed {
		t.Errorf("mismatch in parsed ReleaseElement: %+v", parsed)
	}
}
