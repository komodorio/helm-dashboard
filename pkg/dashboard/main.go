package dashboard

import (
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/release"
	"os"
	"os/exec"
)

type DataLayer struct {
}

func (l *DataLayer) runCommand(cmd ...string) error {
	log.Debugf("Starting command: %s", cmd)
	prog := exec.Command(cmd[0], cmd[1:]...)

	//prog.Stdout, prog.Stderr = os.Stdout, os.Stderr
	if err := prog.Run(); err != nil {
		if eerr, ok := err.(*exec.ExitError); ok {
			os.Stderr.Write(eerr.Stderr)
			return errors.New(fmt.Sprintf("Failed to run command %s: %s", cmd, eerr))
		}
		return err
	}

	return nil
}

func (l *DataLayer) CheckConnectivity() error {
	err := l.runCommand("helm", "env")
	if err != nil {
		return err
	}
	// TODO: check that we can work with context and subcommands
	return nil
}

func (l *DataLayer) ListInstalled() []*release.Release {
	return nil // TODO
}
