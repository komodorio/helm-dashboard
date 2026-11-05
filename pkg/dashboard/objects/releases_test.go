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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

func TestReleaseHelmStorageNamespace(t *testing.T) {
	rel := NewRelease(fakeHelmNSConfigGetter, &release.Release{
		Name:      "educates-contour",
		Namespace: "projectcontour",
	}, nil, "educates")

	assert.Equal(t, rel.helmStorageNamespace(), "educates")

	fallback := NewRelease(fakeHelmNSConfigGetter, &release.Release{
		Name:      "plain",
		Namespace: "default",
	}, nil, "")
	assert.Equal(t, fallback.helmStorageNamespace(), "default")
}

func TestListReleases_StorageNamespace(t *testing.T) {
	fakeStorage = storage.Init(driver.NewMemory())
	err := fakeStorage.Create(&release.Release{
		Name:      "educates-contour",
		Namespace: "projectcontour",
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)

	releases := &Releases{
		Namespaces: []string{"educates"},
		HelmConfig: fakeHelmNSConfigGetter,
	}

	res, err := releases.List()
	assert.NilError(t, err)
	assert.Equal(t, len(res), 1)
	assert.Equal(t, res[0].Orig.Name, "educates-contour")
	assert.Equal(t, res[0].Orig.Namespace, "projectcontour")
	assert.Equal(t, res[0].StorageNamespace, "educates")
	assert.Equal(t, res[0].helmStorageNamespace(), "educates")
}

func TestListReleases_DefaultAllNamespaces(t *testing.T) {
	fakeStorage = storage.Init(driver.NewMemory())
	err := fakeStorage.Create(&release.Release{
		Name:      "test-release",
		Namespace: "default",
		Version:   1,
		Info: &release.Info{
			Status: release.StatusDeployed,
		},
	})
	assert.NilError(t, err)

	releases := &Releases{
		Namespaces: []string{""},
		HelmConfig: fakeHelmNSConfigGetter,
	}

	res, err := releases.List()
	assert.NilError(t, err)
	assert.Equal(t, len(res), 1)
	assert.Equal(t, res[0].Orig.Name, "test-release")
	assert.Equal(t, res[0].Orig.Namespace, "default")
	assert.Equal(t, res[0].helmStorageNamespace(), "default")
}

func TestExtractSecretStorageNamespaces(t *testing.T) {
	secrets := []corev1.Secret{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.redis.v1",
				Namespace: "team-a",
				Labels:    map[string]string{"name": "redis", "version": "1", "owner": "helm"},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.redis.v2",
				Namespace: "team-a",
				Labels:    map[string]string{"name": "redis", "version": "2", "owner": "helm"},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.redis.v1",
				Namespace: "team-b",
				Labels:    map[string]string{"name": "redis", "version": "1", "owner": "helm"},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.app.v1",
				Namespace: "storage-ns",
				Labels:    map[string]string{"name": "app", "version": "1", "owner": "helm"},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "empty-ns",
				Namespace: "",
			},
		},
	}

	res := ExtractSecretStorageNamespaces(secrets)
	assert.DeepEqual(t, res, []string{"storage-ns", "team-a", "team-b"})
}

func TestExtractConfigMapStorageNamespaces(t *testing.T) {
	cms := []corev1.ConfigMap{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.db.v1",
				Namespace: "production",
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.db.v2",
				Namespace: "production",
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "sh.helm.release.v1.frontend.v1",
				Namespace: "staging",
			},
		},
	}

	res := ExtractConfigMapStorageNamespaces(cms)
	assert.DeepEqual(t, res, []string{"production", "staging"})
}
