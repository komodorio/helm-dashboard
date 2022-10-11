package subproc

import (
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"sync"
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

	chartRepoName, curVer, err := utils.ChartAndVersion(chart.Chart)
	if err != nil {
		t.Fatal(err)
	}
	_ = curVer

	upgrade, err := data.ChartRepoVersions(chartRepoName)
	if err != nil {
		t.Fatal(err)
	}
	_ = upgrade

	manifests, err := data.RevisionManifestsParsed(chart.Namespace, chart.Name, history[len(history)-1].Revision)
	if err != nil {
		t.Fatal(err)
	}
	_ = manifests

	var wg sync.WaitGroup
	res := make([]*v1.Carp, 0)
	for _, m := range manifests {
		wg.Add(1)
		mc := m // fix the clojure
		func() {
			defer wg.Done()
			lst, err := data.GetResource(chart.Namespace, mc)
			if err != nil {
				t.Fatal(err)
			}
			res = append(res, lst)
		}()
	}
	wg.Wait()

	diff, err := RevisionDiff(data.RevisionManifests, ".yaml", chart.Namespace, chart.Name, history[len(history)-1].Revision, history[len(history)-2].Revision, true)
	if err != nil {
		t.Fatal(err)
	}
	_ = diff
}
