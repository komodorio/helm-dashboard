package dashboard

import (
	"helm.sh/helm/v3/pkg/release"
	"testing"
)

func TestFlow(t *testing.T) {
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
}
