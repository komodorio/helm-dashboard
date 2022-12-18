package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jessevdk/go-flags"
	"github.com/komodorio/helm-dashboard/pkg/dashboard"
	"github.com/pkg/browser"
	log "github.com/sirupsen/logrus"
)

var (
	version = "0.0.0"
	commit  = "none"
	date    = "unknown"
)

type options struct {
	Version    bool   `long:"version" description:"Show tool version"`
	Verbose    bool   `short:"v" long:"verbose" description:"Show verbose debug information"`
	NoBrowser  bool   `short:"b" long:"no-browser" description:"Do not attempt to open Web browser upon start"`
	NoTracking bool   `long:"no-analytics" description:"Disable user analytics (GA, DataDog etc.)"`
	BindHost   string `long:"bind" description:"Host binding to start server (default: localhost)"` // default should be printed but not assigned as the precedence: flag > env > default
	Port       uint   `short:"p" long:"port" description:"Port to start server on" default:"8080"`  // TODO: better default port to clash less?
	Namespace  string `short:"n" long:"namespace" description:"Limit operations to a specific namespace"`
}

func main() {
	opts := parseFlags()
	if opts.BindHost == "" {
		host := os.Getenv("HD_BIND")
		if host == "" {
			host = "localhost"
		}
		opts.BindHost = host
	}

	opts.Verbose = opts.Verbose || os.Getenv("DEBUG") != ""
	setupLogging(opts.Verbose)

	server := dashboard.Server{
		Version:    version,
		Namespace:  opts.Namespace,
		Address:    fmt.Sprintf("%s:%d", opts.BindHost, opts.Port),
		Debug:      opts.Verbose,
		NoTracking: opts.NoTracking,
	}
	address, webServerDone := server.StartServer()

	if !opts.NoTracking {
		log.Infof("User analytics is collected to improve the quality, disable it with --no-analytics")
	}

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
	ns := os.Getenv("HELM_NAMESPACE")
	if ns == "default" {
		ns = ""
	}

	opts := options{Namespace: ns}
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
		fmt.Println(version)
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
