package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/jessevdk/go-flags"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"github.com/pkg/browser"
	log "github.com/sirupsen/logrus"
)

var (
	version = "0.0.0"
	commit  = "none"
	date    = "unknown"
)

type options struct {
	Version    bool     `long:"version" description:"Show tool version"`
	Verbose    bool     `short:"v" long:"verbose" description:"Show verbose debug information"`
	NoBrowser  bool     `short:"b" long:"no-browser" description:"Do not attempt to open Web browser upon start"`
	NoTracking bool     `long:"no-analytics" description:"Disable user analytics (Heap, DataDog etc.)"`
	BindHost   string   `long:"bind" description:"Host binding to start server (default: localhost)"` // default should be printed but not assigned as the precedence: flag > env > default
	Port       uint     `short:"p" long:"port" description:"Port to start server on" default:"8080"`
	Namespace  string   `short:"n" long:"namespace" description:"Namespace for HELM operations"`
	Devel      bool     `long:"devel" description:"Include development versions of charts"`
	LocalChart []string `long:"local-chart" description:"Specify location of local chart to include into UI"`
}

func main() {
	err := os.Setenv("HD_VERSION", version) // for anyone willing to access it
	if err != nil {
		fmt.Println("Failed to remember app version because of error: " + err.Error())
	}

	opts := parseFlags()
	if opts.BindHost == "" {
		host := os.Getenv("HD_BIND")
		if host == "" {
			host = "localhost"
		}
		opts.BindHost = host
	}

	opts.Verbose = opts.Verbose || utils.EnvAsBool("DEBUG", false)
	setupLogging(opts.Verbose)

	server := dashboard.Server{
		Version:     version,
		Namespaces:  strings.Split(opts.Namespace, ","),
		Address:     fmt.Sprintf("%s:%d", opts.BindHost, opts.Port),
		Debug:       opts.Verbose,
		NoTracking:  opts.NoTracking,
		Devel:       opts.Devel,
		LocalCharts: opts.LocalChart,
	}

	ctx, cancel := context.WithCancel(context.Background())

	osSignal := make(chan os.Signal, 1)
	signal.Notify(osSignal, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		oscall := <-osSignal
		log.Warnf("Stopping on signal: %s\n", oscall)
		cancel()
	}()

	address, webServerDone, err := server.StartServer(ctx, cancel)
	if err != nil {
		if errorx.IsOfType(err, errorx.InitializationFailed) {
			log.Debugf("Full error: %+v", err)
			log.Errorf("No Kubernetes cluster connection possible. Make sure you have valid kubeconfig file or run dashboard from inside cluster. See https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/")
			os.Exit(1)
		} else {
			log.Fatalf("Failed to start Helm Dashboard: %+v", err)
		}
	}

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
	if ns == "default" { // it's how Helm passes to plugin the empty NS, we have to reset it back
		ns = ""
	}

	opts := options{Namespace: ns}
	args, err := flags.Parse(&opts)
	if err != nil {
		var e *flags.Error
		if errors.As(err, &e) {
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
		fmt.Println("The program does not take arguments, see --help for usage")
		os.Exit(1)
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
