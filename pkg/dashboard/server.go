package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/joomcode/errorx"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/objects"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hashicorp/go-version"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/scanners"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
)

type Server struct {
	Version    string
	Namespace  string
	Address    string
	Debug      bool
	NoTracking bool
}

func (s *Server) StartServer() (string, utils.ControlChan, error) {
	data, err := objects.NewDataLayer(s.Namespace, s.Version, objects.NewHelmConfig)
	if err != nil {
		return "", nil, errorx.Decorate(err, "Failed to create data layer")
	}

	isDevModeWithAnalytics := os.Getenv("HD_DEV_ANALYTICS") == "true"
	data.StatusInfo.Analytics = (!s.NoTracking && s.Version != "0.0.0") || isDevModeWithAnalytics

	err = s.detectClusterMode(data)
	if err != nil {
		return "", nil, err
	}

	go checkUpgrade(data.StatusInfo)

	discoverScanners(data)

	abort := make(utils.ControlChan)
	api := NewRouter(abort, data, s.Debug)
	done := s.startBackgroundServer(api, abort)

	return "http://" + s.Address, done, nil
}

func (s *Server) detectClusterMode(data *objects.DataLayer) error {
	data.StatusInfo.ClusterMode = os.Getenv("HD_CLUSTER_MODE") != ""
	if data.StatusInfo.ClusterMode {
		return nil
	}

	ctxs, err := data.ListContexts()
	if err != nil {
		return err
	}

	if len(ctxs) == 0 {
		log.Infof("Got no kubectl config contexts, will attempt to detect if we're inside cluster...")
		app, err := data.AppForCtx("")
		if err != nil {
			return err
		}
		ns, err := app.K8s.GetNameSpaces()
		if err != nil { // no point in continuing without kubectl context and k8s connection
			return err
		}
		log.Debugf("Got %d namespaces listed", len(ns.Items))
		data.StatusInfo.ClusterMode = true
	}
	return err
}

func (s *Server) startBackgroundServer(routes *gin.Engine, abort utils.ControlChan) utils.ControlChan {
	done := make(utils.ControlChan)
	server := &http.Server{
		Addr:    s.Address,
		Handler: routes,
	}

	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Warnf("Looks like port is busy for %s, checking if it's us...", s.Address)
			if s.itIsUs() {
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

func (s *Server) itIsUs() bool {
	url := fmt.Sprintf("http://%s/status", s.Address)
	var myClient = &http.Client{
		Timeout: 5 * time.Second,
	}
	r, err := myClient.Get(url)
	if err != nil {
		log.Debugf("It's not us on %s: %s", s.Address, err)
		return false
	}
	defer r.Body.Close()

	return strings.HasPrefix(r.Header.Get("X-Application-Name"), "Helm Dashboard")
}

func discoverScanners(data *objects.DataLayer) {
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

func checkUpgrade(d *objects.StatusInfo) { // TODO: check it once an hour
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
		log.Warnf("Failed to parse CurVer: %s", err)
		v1 = &version.Version{}
	}

	v2, err := version.NewVersion(d.LatestVer)
	if err != nil {
		log.Warnf("Failed to parse RepoLatestVer: %s", err)
	} else {
		if v1.LessThan(v2) {
			log.Warnf("Newer Helm Dashboard version is available: %s", d.LatestVer)
			log.Warnf("Upgrade instructions: https://github.com/komodorio/helm-dashboard#installing")
		} else {
			log.Debugf("Got latest version from GH: %s", d.LatestVer)
		}
	}
}
