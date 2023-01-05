package objects

import (
	"testing"

	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/repo"
)

func TestLoadRepo(t *testing.T) {

	filePath := "./testdata/repositories.yaml"

	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	settings := cli.New()

	// Sets the repository file path
	settings.RepositoryConfig = filePath

	hc, err := NewHelmConfig(settings, "TEST")
	if err != nil {
		t.Fatal(err, "Failed to create Helm Configuration")
	}
	testRepository := &Repositories{
		Settings:   settings,
		HelmConfig: hc,
	}

	file, err := testRepository.Load()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, file.Generated, res.Generated)
}
