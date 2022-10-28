package main

import (
	"flag"
	"fmt"
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
	verbose := false
	flag.BoolVar(&verbose, "v", false, "")
	flag.BoolVar(&verbose, "verbose", false, "Display more debugging output")

	help := false
	flag.BoolVar(&help, "h", false, "")
	flag.BoolVar(&help, "help", false, "Display tool help")

	noBrowser := false
	flag.BoolVar(&noBrowser, "no-browser", false, "Do not attempt to open Web browser upon start")

	port := 8080 // TODO: better default port to clash less?
	flag.IntVar(&port, "p", port, "")
	flag.IntVar(&port, "port", port, fmt.Sprintf("Port to start server on, default is %d", port))

	ns := ""
	flag.StringVar(&ns, "n", ns, "")
	flag.StringVar(&ns, "namespace", ns, "Limit operations to a specific namespace")

	flag.Parse()
	setupLogging(verbose || os.Getenv("DEBUG") != "")
	if help {
		flag.Usage()
		os.Exit(0)
	}

	address, webServerDone := dashboard.StartServer(version, port, ns)

	if os.Getenv("HD_NOBROWSER") == "" && !noBrowser {
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

func setupLogging(verbose bool) {
	if verbose {
		log.SetLevel(log.DebugLevel)
		gin.SetMode(gin.DebugMode)
		log.Debugf("Debug logging is enabled")
	} else {
		log.SetLevel(log.InfoLevel)
		gin.SetMode(gin.ReleaseMode)
	}
	log.Infof("Helm Dashboard by Komodor, version %s (%s @ %s)", version, commit, date)
}
