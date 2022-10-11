package scanners

import (
	"encoding/json"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"strings"
)

type Checkov struct {
	Data *subproc.DataLayer
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

func (c *Checkov) Run(qp *utils.QueryProps) (*subproc.ScanResults, error) {
	mnf, err := c.Data.RevisionManifests(qp.Namespace, qp.Name, qp.Revision, false)
	if err != nil {

		return nil, err
	}

	fname, fclose, err := utils.TempFile(mnf)
	defer fclose()

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "json", "--file", fname}
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

type CheckovResults struct {
	Summary CheckovSummary
}

type CheckovSummary struct {
	Failed        int `json:"failed"`
	Passed        int `json:"passed"`
	ResourceCount int `json:"resource_count"`
	// parsing errors?
	// skipped ?
}
