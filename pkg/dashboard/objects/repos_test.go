package objects

import (
	"helm.sh/helm/v3/pkg/action"
	"testing"

	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/repo"
)

var filePath = "./testdata/repositories.yaml"

func initRepository(t *testing.T, filePath string) *Repositories {
	t.Helper()

	settings := cli.New()

	// Sets the repository file path
	settings.RepositoryConfig = filePath

	testRepository := &Repositories{
		Settings:   settings,
		HelmConfig: &action.Configuration{}, // maybe use copy of getFakeHelmConfig from api_test.go
	}

	return testRepository
}

func TestLoadRepo(t *testing.T) {

	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	testRepository := initRepository(t, filePath)

	file, err := testRepository.Load()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, file.Generated, res.Generated)
}

func TestList(t *testing.T) {
	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	testRepository := initRepository(t, filePath)

	repos, err := testRepository.List()

	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, len(repos), len(res.Repositories))
}

func TestAdd(t *testing.T) {
	testRepoName := "TEST"
	testRepoUrl := "https://helm.github.io/examples"

	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	// Delete the repository if already exist
	res.Remove(testRepoName)

	testRepository := initRepository(t, filePath)

	err = testRepository.Add(testRepoName, testRepoUrl)

	if err != nil {
		t.Fatal(err, "Failed to add repo")
	}

	// Reload the file
	res, err = repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, res.Has(testRepoName), true)

	// Removes test repository which is added for testing
	t.Cleanup(func() {
		removed := res.Remove(testRepoName)
		if removed != true {
			t.Log("Failed to clean the test repository file")
		}
		err = res.WriteFile(filePath, 0644)
		if err != nil {
			t.Log("Failed to write the file while cleaning test repo")
		}
	})
}

func TestDelete(t *testing.T) {
	testRepoName := "TEST DELETE"
	testRepoUrl := "https://helm.github.io/examples"

	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	// Add a test entry
	res.Add(&repo.Entry{Name: testRepoName, URL: testRepoUrl})
	err = res.WriteFile(filePath, 0644)
	if err != nil {
		t.Fatal("Failed to write the file while creating test repo")
	}

	testRepository := initRepository(t, filePath)

	err = testRepository.Delete(testRepoName)
	if err != nil {
		t.Fatal(err, "Failed to delete the repo")
	}

	// Reload the file
	res, err = repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, res.Has(testRepoName), false)
}

func TestGet(t *testing.T) {
	// Initial repositiry name in test file
	repoName := "charts"

	testRepository := initRepository(t, filePath)

	repo, err := testRepository.Get(repoName)
	if err != nil {
		t.Fatal(err, "Failed to get th repo")
	}

	assert.Equal(t, repo.Orig.Name, repoName)
}
