package subproc

import (
	log "github.com/sirupsen/logrus"
	"testing"
)

func TestApplication_GetReleases(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	c, err := NewHelmConfig("")

	app, err := NewApplication(c)
	if err != nil {
		log.Fatalf("%+v", err)
	}

	err = app.SetContext("")
	//err := app.SetContext("kind-kind")
	if err != nil {
		log.Fatalf("%+v", err)
	}
	rels, err := app.GetReleases()
	if err != nil {
		log.Fatalf("%+v", err)
	}

	log.Infof("%v", rels)
	hist, err := rels[0].History()
	if err != nil {
		log.Fatalf("%+v", err)
	}
	log.Infof("%v", hist)
}
