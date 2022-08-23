package dashboard

import (
	"helm.sh/helm/v3/pkg/release"
)

type DataLayer struct {
}

func (l *DataLayer) CheckConnectivity() {
	// TODO: check that we can work with context and subcommands
}

func (l *DataLayer) ListInstalled() []*release.Release {
	return nil // TODO
}
