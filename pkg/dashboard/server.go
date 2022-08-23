package dashboard

import (
	"context"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"strings"
)

func StartServer() (string, ControlChan) {
	data := DataLayer{}
	data.CheckConnectivity()

	address := os.Getenv("HD_BIND")
	if os.Getenv("HD_PORT") == "" {
		address += ":8080" // TODO: better default port to clash less?
	} else {
		address += ":" + os.Getenv("HD_PORT")
	}

	abort := make(ControlChan)
	api := newRouter(abort, data)
	done := startBackgroundServer(address, api, abort)

	if strings.HasPrefix(address, ":") {
		address = "localhost" + address
	}
	return "http://" + address, done
}

func startBackgroundServer(addr string, routes *gin.Engine, abort ControlChan) ControlChan {
	done := make(ControlChan)
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
