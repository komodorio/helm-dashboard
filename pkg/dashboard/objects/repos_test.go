package objects

import (
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

	fname, err := os.CreateTemp("", "repo-*.yaml")
	if err != nil {
		t.Fatal(err)
	}

	input, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	err = os.WriteFile(fname.Name(), input, 0644)
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
		LocalCharts:       []string{"../../../charts/helm-dashboard"},
	}

	return testRepository
}

func TestFlow(t *testing.T) {
	testRepository := initRepository(t, validRepositoryConfigPath, false)

	// initial list
	repos, err := testRepository.List()
	assert.NilError(t, err)
	assert.Equal(t, len(repos), 5)

	testRepoName := "TEST"
	testRepoUrl := "https://helm.github.io/examples"

	// add repo
	err = testRepository.Add(testRepoName, testRepoUrl, "", "")
	assert.NilError(t, err)

	// get repo
	r, err := testRepository.Get(testRepoName)
	assert.NilError(t, err)
	assert.Equal(t, r.URL(), testRepoUrl)

	// update repo
	err = r.Update()
	assert.NilError(t, err)

	// list charts
	c, err := r.Charts()
	assert.NilError(t, err)

	// contains chart
	c, err = testRepository.Containing(c[0].Name)
	assert.NilError(t, err)

	// chart by name from repo
	c, err = r.ByName(c[0].Name)
	assert.NilError(t, err)

	// get chart values
	v, err := testRepository.GetChartValues(r.Name()+"/"+c[0].Name, c[0].Version)
	assert.NilError(t, err)
	assert.Assert(t, v != "")

	// delete added
	err = testRepository.Delete(testRepoName)
	assert.NilError(t, err)

	// final list
	repos, err = testRepository.List()
	assert.NilError(t, err)
	assert.Equal(t, len(repos), 5)
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
