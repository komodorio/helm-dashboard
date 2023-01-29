package objects

import (
	"sync"
	"testing"

	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/action"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

var (
	fakeKubeClient *kubefake.PrintingKubeClient
	fakeStorage    *storage.Storage
)

func fakeHelmNSConfigGetter(ns string) (*action.Configuration, error) {
	return &action.Configuration{
		KubeClient: fakeKubeClient,
		Releases:   fakeStorage,
	}, nil
}

func TestListReleases(t *testing.T) {
	fakeStorage = storage.Init(driver.NewMemory())
	err := fakeStorage.Create(&release.Release{
		Name: "release1",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)
	err = fakeStorage.Create(&release.Release{
		Name: "release2",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)
	err = fakeStorage.Create(&release.Release{
		Name: "release3",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)
	err = fakeStorage.Create(&release.Release{
		Name: "release4",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)
	err = fakeStorage.Create(&release.Release{
		Name: "release5",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)

	releases := &Releases{
		Namespaces: []string{"testNamespace"},
		HelmConfig: fakeHelmNSConfigGetter,
		mx:         sync.Mutex{},
	}

	res, err := releases.List()
	assert.NilError(t, err)

	assert.Equal(t, len(res), 5)
	assert.Equal(t, res[0].Orig.Name, "release1")
	assert.Equal(t, res[1].Orig.Name, "release2")
	assert.Equal(t, res[2].Orig.Name, "release3")
	assert.Equal(t, res[3].Orig.Name, "release4")
	assert.Equal(t, res[4].Orig.Name, "release5")
}
