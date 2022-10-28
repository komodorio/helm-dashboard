package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/jessevdk/go-flags"
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

type options struct {
	Verbose   bool `short:"v" long:"verbose" description:"Show verbose debug information"`
	NoBrowser bool `short:"b" long:"no-browser" description:"Do not attempt to open Web browser upon start"`
	Version   bool `long:"version" description:"Show tool version"`

	Port uint `short:"p" long:"port" description:"Port to start server on" default:"8080"` // TODO: better default port to clash less?

	Namespace string `short:"n" long:"namespace" description:"Limit operations to a specific namespace"`
}

func main() {
	opts := parseFlags()

	setupLogging(opts.Verbose)

	address, webServerDone := dashboard.StartServer(version, int(opts.Port), opts.Namespace, opts.Verbose)

	if opts.NoBrowser {
		log.Infof("Access web UI at: %s", address)
	} else {
		log.Infof("Opening web UI: %s", address)
		err := browser.OpenURL(address)
		if err != nil {
			log.Warnf("Failed to open Web browser for URL: %s", err)
		}
	}

	<-webServerDone
	log.Infof("Done.")
}

func parseFlags() options {
	opts := options{}
	args, err := flags.Parse(&opts)
	if err != nil {
		if e, ok := err.(*flags.Error); ok {
			if e.Type == flags.ErrHelp {
				os.Exit(0)
			}
		}

		// we rely on default behavior to print the problem inside `flags` library
		os.Exit(1)
	}

	if opts.Version {
		fmt.Print(version)
		os.Exit(0)
	}

	if len(args) > 0 {
		panic("The program does not take argumants, see --help for usage")
	}
	return opts
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
