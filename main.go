package main

import (
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard"
	log "github.com/sirupsen/logrus"
	"github.com/toqueteos/webbrowser"
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

	address, webServerDone, err := dashboard.StartServer()

	log.Infof("Opening web UI: %s", address)
	err = webbrowser.Open("http://localhost:8080")
	if err != nil {
		log.Warnf("Failed to open Web browser for URL: %s", err)
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
