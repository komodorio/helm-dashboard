package main

import (
	log "github.com/sirupsen/logrus"
	"github.com/toqueteos/webbrowser"
	_ "k8s.io/client-go/plugin/pkg/client/auth" //required for auth
	"net/http"
	"os"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	log.Infof("Helm Dashboard by Komodor, version %s (%s @ %s)", version, commit, date)

	if len(os.Args) > 1 {
		os.Exit(0)
	}

	go func() {
		// TODO: if it's already running - just open the tab, check that it's another instance of us via API
		err := webbrowser.Open("http://localhost:8080")
		if err != nil {
			return
		}
	}()

	panic(http.ListenAndServe(":8080", http.FileServer(http.Dir("/tmp"))))
	/* v := cmd.NewRootCmd(os.Stdout, os.Args[1:])
	if err := v.Execute(); err != nil {
		os.Exit(1)
	}

	*/
}
