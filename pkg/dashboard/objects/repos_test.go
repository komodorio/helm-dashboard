package objects

import (
	"io/ioutil"
	"os"
	"path"
	"testing"

	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
)

const (
	validRepositoryConfigPath                    = "./testdata/repositories.yaml"
	invalidCacheFileRepositoryConfigPath         = "./testdata/repositories-invalid-cache-file.yaml"
	invalidMalformedManifestRepositoryConfigPath = "./testdata/repositories-malformed-manifest.yaml"
)

func initRepository(t *testing.T, filePath string, devel bool) *Repositories {
	t.Helper()

	settings := cli.New()

	fname, err := ioutil.TempFile("", "repo-*.yaml")
	if err != nil {
		t.Fatal(err)
	}

	input, err := ioutil.ReadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	err = ioutil.WriteFile(fname.Name(), input, 0644)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		err := os.Remove(fname.Name())
		if err != nil {
			t.Fatal(err)
		}
	})

	vc, err := versionConstaint(devel)
	if err != nil {
		t.Fatal(err)
	}

	// Sets the repository file path
	settings.RepositoryConfig = fname.Name()
	settings.RepositoryCache = path.Dir(filePath)

	testRepository := &Repositories{
		Settings:          settings,
		HelmConfig:        &action.Configuration{}, // maybe use copy of getFakeHelmConfig from api_test.go
		versionConstraint: vc,
	}

	return testRepository
}

func TestList(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	repos, err := testRepository.List()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, len(repos), 4)
}

func TestAdd(t *testing.T) {
	testRepoName := "TEST"
	testRepoUrl := "https://helm.github.io/examples"

	testRepository := initRepository(t, validRepositoryConfigPath, false)
	err := testRepository.Add(testRepoName, testRepoUrl)
	if err != nil {
		t.Fatal(err, "Failed to add repo")
	}

	r, err := testRepository.Get(testRepoName)
	if err != nil {
		t.Fatal(err, "Failed to add repo")
	}

	assert.Equal(t, r.Orig.URL, testRepoUrl)
}

func TestDelete(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	testRepoName := "charts" // don't ever delete 'testing'!
	err := testRepository.Delete(testRepoName)
	if err != nil {
		t.Fatal(err, "Failed to delete the repo")
	}

	_, err = testRepository.Get(testRepoName)
	if err == nil {
		t.Fatal("Failed to delete repo")
	}
}

func TestGet(t *testing.T) {
	// Initial repositiry name in test file
	repoName := "charts"

	testRepository := initRepository(t, validRepositoryConfigPath, false)

	repo, err := testRepository.Get(repoName)
	if err != nil {
		t.Fatal(err, "Failed to get th repo")
	}

	assert.Equal(t, repo.Orig.Name, repoName)
}

func TestRepository_Charts_DevelDisabled(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	r, err := testRepository.Get("testing")
	if err != nil {
		t.Fatal(err)
	}

	charts, err := r.Charts()
	if err != nil {
		t.Fatal(err)
	}

	// Total charts in ./testdata/testing-index.yaml = 4
	// Excluded charts = 2 (1 has invalid version, 1 has only dev version)
	// Included charts = 2 (2 stable versions)
	expectedCount := 2
	if len(charts) != expectedCount {
		t.Fatalf("Wrong charts count: %d, expected: %d", len(charts), expectedCount)
	}
}

func TestRepository_Charts_DevelEnabled(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, true)

	r, err := testRepository.Get("testing")
	if err != nil {
		t.Fatal(err)
	}

	charts, err := r.Charts()
	if err != nil {
		t.Fatal(err)
	}

	// Total charts in ./testdata/testing-index.yaml = 4
	// Excluded charts = 1 (1 has invalid version)
	// Included charts = 3 (2 stable versions, 1 has only dev version)
	expectedCount := 3
	if len(charts) != expectedCount {
		t.Fatalf("Wrong charts count: %d, expected: %d", len(charts), expectedCount)
	}
}

func TestRepository_Charts_InvalidCacheFile(t *testing.T) {
	testRepository := initRepository(t, invalidCacheFileRepositoryConfigPath, false)

	r, err := testRepository.Get("non-existing")
	if err != nil {
		t.Fatal(err)
	}

	_, err = r.Charts()
	if err == nil {
		t.Fatalf("Expected error for invalid cache file path, got nil")
	}
}

func TestRepositories_Containing_DevelDisable(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	chartVersions, err := testRepository.Containing("alpine")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart alpine in ./testdata/testing-index.yaml = 3
	// Excluded charts = 1 (1 dev version)
	// Included charts = 2 (2 stable versions)
	expectedCount := 2
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_DevelEnabled(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, true)

	chartVersions, err := testRepository.Containing("alpine")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart alpine in ./testdata/testing-index.yaml = 3
	// Excluded charts = 0
	// Included charts = 3 (2 stable versions, 1 dev version)
	expectedCount := 3
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_DevelDisable_OnlyDevVersionsOfChartAvailable(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	chartVersions, err := testRepository.Containing("traefik")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart traefik in ./testdata/testing-index.yaml = 1
	// Excluded charts = 1 (1 dev version)
	// Included charts = 0
	expectedCount := 0
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_DevelEnabled_OnlyDevVersionsOfChartAvailable(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, true)

	chartVersions, err := testRepository.Containing("traefik")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart traefik in ./testdata/testing-index.yaml = 1
	// Excluded charts = 0
	// Included charts = 1 (1 dev version)
	expectedCount := 1
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_DevelDisable_InvalidChartVersion(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	chartVersions, err := testRepository.Containing("rabbitmq")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart rabbitmq in ./testdata/testing-index.yaml = 1
	// Excluded charts = 1 (1 invalid version)
	// Included charts = 0
	expectedCount := 0
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_DevelEnabled_InvalidChartVersion(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, true)

	chartVersions, err := testRepository.Containing("rabbitmq")
	if err != nil {
		t.Fatal(err)
	}

	// Total versions of chart rabbitmq in ./testdata/testing-index.yaml = 1
	// Excluded charts = 1 (1 invalid version)
	// Included charts = 0
	expectedCount := 0
	if len(chartVersions) != expectedCount {
		t.Fatalf("Wrong charts versions count: %d, expected: %d", len(chartVersions), expectedCount)
	}

}

func TestRepositories_Containing_MalformedRepositoryConfigFile(t *testing.T) {
	testRepository := initRepository(t, invalidMalformedManifestRepositoryConfigPath, false)

	_, err := testRepository.Containing("alpine")
	if err == nil {
		t.Fatalf("Expected error for malformed RepositoryConfig file, got nil")
	}
}
