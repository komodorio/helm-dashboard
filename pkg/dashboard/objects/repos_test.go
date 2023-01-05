package objects

import (
	"io/ioutil"
	"os"
	"path"
	"testing"

	"gopkg.in/yaml.v3"
	"gotest.tools/v3/assert"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/helmpath"
	"helm.sh/helm/v3/pkg/repo"
)

func envOr(name, def string) string {
	if v, ok := os.LookupEnv(name); ok {
		return v
	}
	return def
}

func TestLoadRepo(t *testing.T) {

	fileName := "repositories.yaml"
	tmpDir := t.TempDir()

	os.Setenv("HELM_CONFIG_HOME", tmpDir)

	yamlData, err := yaml.Marshal(repo.NewFile())
	if err != nil {
		t.Fatal(err, "failed to create YAML bytes")
	}

	err = ioutil.WriteFile(path.Join(tmpDir, fileName), yamlData, 0644)
	if err != nil {
		t.Fatal(err, "failed to create a test file")
	}

	filePath := envOr("HELM_REPOSITORY_CONFIG", helmpath.ConfigPath(fileName))
	res, err := repo.LoadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}

	settings := cli.New()
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
