package handlers

import (
	"testing"
	"time"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/release"
	helmtime "helm.sh/helm/v3/pkg/time"
)

func TestHReleaseToJSON(t *testing.T) {
	now := helmtime.Time{Time: time.Now()}

	t.Run("complete release", func(t *testing.T) {
		rel := &release.Release{
			Name:      "my-release",
			Namespace: "default",
			Version:   1,
			Info: &release.Info{
				LastDeployed: now,
				Status:       release.StatusDeployed,
			},
			Chart: &chart.Chart{
				Metadata: &chart.Metadata{
					Name:        "my-chart",
					Version:     "1.2.3",
					AppVersion:  "2.0.0",
					Icon:        "https://example.com/icon.png",
					Description: "A sample chart",
				},
			},
		}

		res := HReleaseToJSON(rel)
		if res == nil {
			t.Fatal("expected non-nil ReleaseElement")
		}
		if res.Name != "my-release" || res.Namespace != "default" || res.Revision != "1" {
			t.Errorf("unexpected basic fields: %+v", res)
		}
		if res.Status != release.StatusDeployed || res.Updated != now {
			t.Errorf("unexpected Info fields: %+v", res)
		}
		if res.Chart != "my-chart-1.2.3" || res.ChartName != "my-chart" || res.ChartVersion != "1.2.3" {
			t.Errorf("unexpected Chart fields: %+v", res)
		}
		if res.AppVersion != "2.0.0" || res.Icon != "https://example.com/icon.png" || res.Description != "A sample chart" {
			t.Errorf("unexpected metadata fields: %+v", res)
		}
	})

	t.Run("nil Info and nil Chart", func(t *testing.T) {
		rel := &release.Release{
			Name:      "partial-release",
			Namespace: "kube-system",
			Version:   2,
		}

		res := HReleaseToJSON(rel)
		if res == nil {
			t.Fatal("expected non-nil ReleaseElement")
		}
		if res.Name != "partial-release" || res.Revision != "2" {
			t.Errorf("unexpected basic fields: %+v", res)
		}
		if res.ChartName != "" || res.ChartVersion != "" {
			t.Errorf("expected empty chart fields, got: %+v", res)
		}
	})
}

func TestHReleaseToHistElem(t *testing.T) {
	now := helmtime.Time{Time: time.Now()}

	t.Run("complete release with tests", func(t *testing.T) {
		rel := &release.Release{
			Name:    "my-release",
			Version: 3,
			Info: &release.Info{
				LastDeployed: now,
				Status:       release.StatusDeployed,
				Description:  "Install complete",
			},
			Chart: &chart.Chart{
				Metadata: &chart.Metadata{
					Name:       "my-chart",
					Version:    "1.0.0",
					AppVersion: "1.0.0",
				},
			},
			Hooks: []*release.Hook{
				{
					Events: []release.HookEvent{release.HookTest},
				},
			},
		}

		res := HReleaseToHistElem(rel)
		if res == nil {
			t.Fatal("expected non-nil HistoryElement")
		}
		if res.Revision != 3 || res.Description != "Install complete" || !res.HasTests {
			t.Errorf("unexpected fields: %+v", res)
		}
		if res.Chart != "my-chart-1.0.0" || res.ChartName != "my-chart" || res.ChartVer != "1.0.0" {
			t.Errorf("unexpected chart fields: %+v", res)
		}
	})

	t.Run("nil Chart and nil Info", func(t *testing.T) {
		rel := &release.Release{
			Version: 1,
		}

		res := HReleaseToHistElem(rel)
		if res == nil {
			t.Fatal("expected non-nil HistoryElement")
		}
		if res.Revision != 1 || res.HasTests {
			t.Errorf("unexpected fields: %+v", res)
		}
	})
}
