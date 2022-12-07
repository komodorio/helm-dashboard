package subproc

import (
	log "github.com/sirupsen/logrus"
	"testing"
)

func TestApplication_GetReleases(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	app := NewApplication(nil)
	err := app.SetContext("")
	//err := app.SetContext("kind-kind")
	if err != nil {
		log.Fatalf("%+v", err)
	}
	rels, err := app.GetReleases()
	if err != nil {
		log.Fatalf("%+v", err)
	}

	log.Infof("%v", rels)
	rels[0].History()
}
