package scanners

import (
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"strings"
)

type Checkov struct {
}

func (c *Checkov) Name() string {
	return "Checkov"
}

func (c *Checkov) Test() bool {
	res, err := utils.RunCommand([]string{"checkov", "--version"}, nil)
	if err != nil {
		return false
	}
	log.Infof("Discovered Checkov version: %s", strings.TrimSpace(res))
	return true
}

func (c *Checkov) Run(manifests string) error {
	fname, fclose, err := utils.TempFile(manifests)
	defer fclose()

	res, err := utils.RunCommand([]string{"checkov", "--quiet", "--output", "json", "--file", fname}, nil)
	if err != nil {
		return err
	}

	_ = res

	return nil
}
