package main

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard"
	"github.com/pkg/browser"
	log "github.com/sirupsen/logrus"
	"os"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	setupLogging()

	// TODO: proper command-line parsing
	if len(os.Args) > 1 { // dirty thing to allow --help to work
		os.Exit(0)
	}

	address, webServerDone := dashboard.StartServer(version)

	if os.Getenv("HD_NOBROWSER") == "" {
		log.Infof("Opening web UI: %s", address)
		err := browser.OpenURL(address)
		if err != nil {
			log.Warnf("Failed to open Web browser for URL: %s", err)
		}
	} else {
		log.Infof("Access web UI at: %s", address)
	}

	<-webServerDone
	log.Infof("Done.")
}

func setupLogging() {
	if os.Getenv("DEBUG") == "" {
		log.SetLevel(log.InfoLevel)
		gin.SetMode(gin.ReleaseMode)
	} else {
		log.SetLevel(log.DebugLevel)
		gin.SetMode(gin.DebugMode)
	}
	log.Infof("Helm Dashboard by Komodor, version %s (%s @ %s)", version, commit, date)
}
