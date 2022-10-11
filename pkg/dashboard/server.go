package dashboard

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/scanners"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
)

func StartServer(version string) (string, utils.ControlChan) {
	data := subproc.DataLayer{}
	err := data.CheckConnectivity()
	if err != nil {
		log.Errorf("Failed to check that Helm is operational, cannot continue. The error was: %s", err)
		os.Exit(1) // TODO: propagate error instead?
	}

	discoverScanners(&data)

	address := os.Getenv("HD_BIND")
	if address == "" {
		address = "localhost"
	}

	if os.Getenv("HD_PORT") == "" {
		address += ":8080" // TODO: better default port to clash less?
	} else {
		address += ":" + os.Getenv("HD_PORT")
	}

	abort := make(utils.ControlChan)
	api := NewRouter(abort, &data, version)
	done := startBackgroundServer(address, api, abort)

	return "http://" + address, done
}

func startBackgroundServer(addr string, routes *gin.Engine, abort utils.ControlChan) utils.ControlChan {
	done := make(utils.ControlChan)
	server := &http.Server{Addr: addr, Handler: routes}

	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			panic(err) // TODO: in case of "port busy", check that it's another instance of us and just open browser
		}
		done <- struct{}{}
	}()

	go func() {
		<-abort
		err := server.Shutdown(context.Background())
		if err != nil {
			log.Warnf("Had problems shutting down the server: %s", err)
		}
	}()

	return done
}

func discoverScanners(data *subproc.DataLayer) {
	potential := []subproc.Scanner{
		&scanners.Checkov{Data: data},
		&scanners.Trivy{Data: data},
	}

	data.Scanners = []subproc.Scanner{}
	for _, scanner := range potential {
		if scanner.Test() {
			data.Scanners = append(data.Scanners, scanner)
		}
	}
}
