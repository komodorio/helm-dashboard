package main

import (
	"github.com/toqueteos/webbrowser"
	_ "k8s.io/client-go/plugin/pkg/client/auth" //required for auth
	"net/http"
)

func main() {
	go func() {
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
