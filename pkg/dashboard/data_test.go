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
		t.Fatal(err)
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

	history, err := data.ChartHistory(installed[0].Namespace, installed[0].Name)
	if err != nil {
		t.Fatal(err)
	}
	_ = history

	chartRepoName, curVer, err := chartAndVersion(installed[0].Chart)
	if err != nil {
		t.Fatal(err)
	}
	_ = curVer

	upgrade, err := data.ChartRepoVersions(chartRepoName)
	if err != nil {
		t.Fatal(err)
	}
	_ = upgrade
}
