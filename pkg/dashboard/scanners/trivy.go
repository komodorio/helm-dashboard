package scanners

import (
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"strings"
)

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
)

type Trivy struct {
	Data *subproc.DataLayer
}

func (c *Trivy) Name() string {
	return "Trivy"
}

func (c *Trivy) Test() bool {
	res, err := utils.RunCommand([]string{"trivy", "--version"}, nil)
	if err != nil {
		return false
	}
	parts := strings.Split(res, "\n")
	log.Infof("Discovered Trivy: %s", strings.TrimSpace(parts[0]))
	return true
}

func (c *Trivy) Run(manifests string) (*subproc.ScanResults, error) {
	fname, fclose, err := utils.TempFile(manifests)
	defer fclose()

	cmd := []string{"trivy", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "json", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{}

	err = json.Unmarshal([]byte(out), &res.OrigReport)
	if err != nil {
		return nil, err
	}

	return res, nil
}
