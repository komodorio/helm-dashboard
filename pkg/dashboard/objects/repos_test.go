package objects

import (
	"helm.sh/helm/v3/pkg/action"
	"io/ioutil"
	"os"
	"path"
	"testing"

	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/cli"
)

var filePath = "./testdata/repositories.yaml"

func initRepository(t *testing.T) *Repositories {
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

	// Sets the repository file path
	settings.RepositoryConfig = fname.Name()
	settings.RepositoryCache = path.Dir(filePath)

	testRepository := &Repositories{
		Settings:   settings,
		HelmConfig: &action.Configuration{}, // maybe use copy of getFakeHelmConfig from api_test.go
	}

	return testRepository
}

func TestList(t *testing.T) {
	testRepository := initRepository(t)

	repos, err := testRepository.List()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, len(repos), 4)
}

func TestAdd(t *testing.T) {
	testRepoName := "TEST"
	testRepoUrl := "https://helm.github.io/examples"

	testRepository := initRepository(t)
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
	testRepository := initRepository(t)

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

	testRepository := initRepository(t)

	repo, err := testRepository.Get(repoName)
	if err != nil {
		t.Fatal(err, "Failed to get th repo")
	}

	assert.Equal(t, repo.Orig.Name, repoName)
}

func TestCharts(t *testing.T) {
	testRepository := initRepository(t)

	r, err := testRepository.Get("testing")
	if err != nil {
		t.Fatal(err)
	}

	charts, err := r.Charts()
	if err != nil {
		t.Fatal(err)
	}

	if len(charts) != 2 {
		t.Fatalf("Wrong charts len: %d", len(charts))
	}
}
