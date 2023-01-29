package subproc

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"testing"

	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

func TestFlow(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	data := DataLayer{}

	mockCache := NewCache()
	data.Cache = mockCache

	if err := data.CheckConnectivity(); err != nil {
		if err.Error() != "did not find any kubectl contexts configured" {
			t.Fatal(err)
		}
	}

	ctxses, err := data.ListContexts()
	if err != nil {
		t.Fatal(err)
	}

	if len(ctxses) != 0 {
		t.Fatalf("Expected zero contexts to be returned but returned %d", len(ctxses))
	}

	mockCharts := []ReleaseElement{{
		Namespace: "testingNamespace",
		Name:      "testHelmChart",
	}}
	mockChartsBytes, err := json.Marshal(mockCharts)
	if err != nil {
		t.Fatal(err)
	}
	mockCache.Marshaler.Set(context.TODO(), "installed-releases-list", mockChartsBytes)

	installed, err := data.ListInstalled()
	if err != nil {
		t.Fatal(err)
	}

	chart := installed[0]

	mockHistoryElement := []HistoryElement{
		{
			Chart:       "testHelmChart-testVersion",
			ChartName:   "testHelmChart",
			Description: "test-description",
			ChartVer:    "testVersion",
			Revision:    12,
		},
		{
			Chart:       "testHelmChart-testVersion2",
			ChartName:   "testHelmChart",
			Description: "test-description",
			ChartVer:    "testVersion2",
			Revision:    14,
		},
	}
	mockHistoryElementBytes, err := json.Marshal(mockHistoryElement)
	if err != nil {
		t.Fatal(err)
	}
	mockCache.Marshaler.Set(context.TODO(), "release-historyrelease"+"\v"+chart.Namespace+"\v"+chart.Name, string(mockHistoryElementBytes))

	history, err := data.ReleaseHistory(chart.Namespace, chart.Name)
	if err != nil {
		t.Fatal(err)
	}

	if len(history) != 2 || !(history[0].ChartName == chart.Name) {
		t.Fatalf("unexpected result for release history %+v", history)
	}

	repoVersions, err := data.ChartRepoVersions(chart.Name)
	if err != nil {
		t.Fatal(err)
	}

	if len(repoVersions) != 0 {
		t.Fatalf("unexpected repo versions count returned")
	}

	mockCarp := v1.Carp{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "testingName",
			Namespace: "testingNamespace",
		},
		TypeMeta: metav1.TypeMeta{
			Kind: "testingObject",
		},
	}
	mockCarpBytes, err := json.Marshal(mockCarp)
	if err != nil {
		t.Fatal(err)
	}
	mockCarp2 := v1.Carp{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "testingName2",
			Namespace: "testingNamespace2",
		},
		TypeMeta: metav1.TypeMeta{
			Kind: "testingObject2",
		},
	}
	mockCarpBytes2, err := json.Marshal(mockCarp2)
	if err != nil {
		t.Fatal(err)
	}
	mockCache.Marshaler.Set(context.TODO(), "rev-manifests"+"\v"+chart.Namespace+"\v"+chart.Name+"\v"+strconv.Itoa(history[len(history)-1].Revision), mockCarpBytes)
	mockCache.Marshaler.Set(context.TODO(), "rev-manifests"+"\v"+chart.Namespace+"\v"+chart.Name+"\v"+strconv.Itoa(history[len(history)-2].Revision), mockCarpBytes2)

	manifests, err := data.RevisionManifestsParsed(chart.Namespace, chart.Name, history[len(history)-1].Revision)
	if err != nil {
		t.Fatal(err)
	}

	if len(manifests) != 1 || !(manifests[0].ObjectMeta.Name == "testingName") {
		t.Fatalf("unexpected manifests returned %+v", manifests)
	}

	var wg sync.WaitGroup
	res := make([]*v1.Carp, 0)
	for _, m := range manifests {
		wg.Add(1)
		mc := m // fix the closure
		func() {
			defer wg.Done()
			lst, err := data.GetResource(chart.Namespace, mc)
			if err != nil {
				if !strings.Contains(err.Error(), "the server doesn't have a resource type") {
					fmt.Println(err.Error())
				}
			}
			res = append(res, lst)
		}()
	}
	wg.Wait()

	_, err = RevisionDiff(data.RevisionManifests, ".yaml", chart.Namespace, chart.Name, history[len(history)-1].Revision, history[len(history)-2].Revision, true)
	if err != nil {
		t.Fatal(err)
	}
}
