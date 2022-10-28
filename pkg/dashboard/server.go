package dashboard

import (
	"context"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/hashicorp/go-version"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/scanners"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func StartServer(version string, port int, ns string, debug bool) (string, utils.ControlChan) {
	data := subproc.DataLayer{
		Namespace: ns,
	}
	err := data.CheckConnectivity()
	if err != nil {
		log.Errorf("Failed to check that Helm is operational, cannot continue. The error was: %s", err)
		os.Exit(1) // TODO: propagate error instead?
	}

	data.VersionInfo = &subproc.VersionInfo{CurVer: version}
	go checkUpgrade(data.VersionInfo)

	discoverScanners(&data)

	address := os.Getenv("HD_BIND")
	if address == "" {
		address = "localhost"
	}

	address += ":" + strconv.Itoa(port)

	abort := make(utils.ControlChan)
	api := NewRouter(abort, &data, debug)
	done := startBackgroundServer(address, api, abort)

	return "http://" + address, done
}

func startBackgroundServer(addr string, routes *gin.Engine, abort utils.ControlChan) utils.ControlChan {
	done := make(utils.ControlChan)
	server := &http.Server{Addr: addr, Handler: routes}

	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Warnf("Looks like port is busy for %s, checking if it's us...", addr)
			if itIsUs(addr) {
				log.Infof("Yes, it's another instance of us. Just reuse it.")
			} else {
				panic(err)
			}
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

func itIsUs(addr string) bool {
	var myClient = &http.Client{Timeout: 5 * time.Second}
	r, err := myClient.Get("http://" + addr + "/status")
	if err != nil {
		log.Debugf("It's not us on %s: %s", addr, err)
		return false
	}
	defer r.Body.Close()

	return strings.HasPrefix(r.Header.Get("X-Application-Name"), "Helm Dashboard")
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

func checkUpgrade(d *subproc.VersionInfo) {
	url := "https://api.github.com/repos/komodorio/helm-dashboard/releases/latest"
	type GHRelease struct {
		Name string `json:"name"`
	}

	var myClient = &http.Client{Timeout: 5 * time.Second}
	r, err := myClient.Get(url)
	if err != nil {
		log.Warnf("Failed to check for new version: %s", err)
		return
	}
	defer r.Body.Close()

	target := new(GHRelease)
	err = json.NewDecoder(r.Body).Decode(target)
	if err != nil {
		log.Warnf("Failed to decode new release version: %s", err)
		return
	}
	d.LatestVer = target.Name

	v1, err := version.NewVersion(d.CurVer)
	if err != nil {
		log.Warnf("Failed to parse version: %s", err)
		v1 = &version.Version{}
	}

	v2, err := version.NewVersion(d.LatestVer)
	if err != nil {
		log.Warnf("Failed to parse version: %s", err)
	} else {
		if v1.LessThan(v2) {
			log.Warnf("Newer Helm Dashboard version is available: %s", d.LatestVer)
			log.Warnf("Upgrade instructions: https://github.com/komodorio/helm-dashboard#installing")
		} else {
			log.Debugf("Got latest version from GH: %s", d.LatestVer)
		}
	}
}
