package dashboard

import (
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/release"
	"testing"
)

func TestFlow(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	var _ release.Status
	data := DataLayer{}
	err := data.CheckConnectivity()
	if err != nil {
		if err.Error() == "did not find any kubectl contexts configured" {
			t.Skip()
		} else {
			t.Fatal(err)
		}
	}

	ctxses, err := data.ListContexts()
	if err != nil {
		t.Fatal(err)
	}

	for _, ctx := range ctxses {
		if ctx.IsCurrent {
			data.KubeContext = ctx.Name
		}
	}

	installed, err := data.ListInstalled()
	if err != nil {
		t.Fatal(err)
	}

	chart := installed[1]
	history, err := data.ChartHistory(chart.Namespace, chart.Name)
	if err != nil {
		t.Fatal(err)
	}
	_ = history

	chartRepoName, curVer, err := chartAndVersion(chart.Chart)
	if err != nil {
		t.Fatal(err)
	}
	_ = curVer

	upgrade, err := data.ChartRepoVersions(chartRepoName)
	if err != nil {
		t.Fatal(err)
	}
	_ = upgrade

	manifests, err := data.RevisionManifests(chart.Namespace, chart.Name, history[len(history)-1].Revision, true)
	if err != nil {
		t.Fatal(err)
	}
	_ = manifests

	diff, err := RevisionDiff(data.RevisionManifests, ".yaml", chart.Namespace, chart.Name, history[len(history)-1].Revision, history[len(history)-2].Revision, true)
	if err != nil {
		t.Fatal(err)
	}
	_ = diff
}
