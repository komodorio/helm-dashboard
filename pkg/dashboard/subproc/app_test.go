package subproc

import (
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"os"
	"testing"
)

func TestApplication_GetReleases(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	settings := cli.New()
	// settings.KubeContext
	actionConfig := new(action.Configuration)
	helmDriver := os.Getenv("HELM_DRIVER")
	if err := actionConfig.Init(
		settings.RESTClientGetter(),
		"", // settings.Namespace()
		helmDriver, log.Debugf); err != nil {
		log.Fatal(err)
	}

	app := NewApplication(actionConfig, NewCache())
	rels, err := app.GetReleases()
	if err != nil {
		log.Fatal(err)
	}
	log.Infof("%v", rels)
}
