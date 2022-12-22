package objects

import (
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"testing"
)

func TestApplication_GetReleases(t *testing.T) {
	log.SetLevel(log.DebugLevel)

	app, err := NewApplication(nil, func(ns string) (*action.Configuration, error) {
		return NewHelmConfig(&cli.EnvSettings{}, ns)
	})
	if err != nil {
		log.Fatalf("%+v", err)
	}

	rels, err := app.Releases.List()
	if err != nil {
		log.Fatalf("%+v", err)
	}

	log.Infof("%v", rels)
	for _, rel := range rels {
		ress, err := rel.ParsedManifests()
		if err != nil {
			return
		}
		for _, res := range ress {
			dtext, err := app.K8s.DescribeResource(res.Kind, res.Namespace, res.Name)
			if err != nil {
				log.Fatalf("%+v", err)
			}
			log.Infof(dtext)

			resource, err := app.K8s.GetResource(res.Kind, res.Namespace, res.Name)
			if err != nil {
				log.Fatalf("%+v", err)
			}
			log.Infof("%v", resource)
		}

		hist, err := rel.History()
		if err != nil {
			log.Fatalf("%+v", err)
		}
		log.Infof("History: %v", hist)

		err = rel.Rollback(hist[0].Orig.Version)
		if err != nil {
			log.Fatalf("%+v", err)
		}
	}
}
