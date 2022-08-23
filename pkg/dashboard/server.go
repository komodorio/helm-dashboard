package dashboard

import (
	"context"
	"embed"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
)

// content holds our static web server content.

//go:embed static/*
var content embed.FS

func StartServer() (string, ControlChan, error) {
	data := DataLayer{}
	data.CheckConnectivity()

	address := os.Getenv("HD_BIND")
	if os.Getenv("HD_PORT") == "" {
		address += ":8080" // TODO: better default port to clash less?
	} else {
		address += ":" + os.Getenv("HD_PORT")
	}

	abort := make(ControlChan)
	api := newApi(abort)

	done := startBackgroundServer(address, api, abort)

	return "http://" + address, done, nil
}

func newApi(abortWeb ControlChan) *gin.Engine {
	api := gin.Default()
	//api.Handle(http.MethodGet, "/static/", http.StripPrefix("/static/", http.FileServer(http.FS(content))))
	api.GET("/albums", getAlbums)
	api.DELETE("/", func(c *gin.Context) {
		abortWeb <- struct{}{}
	})
	return api
}

func startBackgroundServer(addr string, routes *gin.Engine, abort ControlChan) ControlChan {
	control := make(ControlChan)
	server := &http.Server{Addr: addr, Handler: routes}

	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			panic(err) // TODO: in case of "port busy", check that it's another instance of us and just open browser
		}
		control <- struct{}{}
	}()

	go func() {
		<-abort
		err := server.Shutdown(context.Background())
		if err != nil {
			log.Warnf("Had problems shutting down the server: %s", err)
		}
	}()

	return control
}

// getAlbums responds with the list of all albums as JSON.
func getAlbums(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, struct{}{})
}
