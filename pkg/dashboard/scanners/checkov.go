package scanners

import (
	"encoding/json"
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

func (c *Checkov) Run(manifests string) (*ScanResults, error) {
	fname, fclose, err := utils.TempFile(manifests)
	defer fclose()

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "json", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res := &ScanResults{}

	err = json.Unmarshal([]byte(out), &res.OrigReport)
	if err != nil {
		return nil, err
	}

	return res, nil
}
