package scanners

import (
	"encoding/json"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
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

	sum := CheckovResults{}
	err = json.Unmarshal([]byte(out), &sum)
	if err != nil {
		return nil, err
	}

	res.PassedCount = sum.Summary.Passed
	res.FailedCount = sum.Summary.Failed

	return res, nil
}

func (c *Checkov) RunResource(ns string, kind string, name string) (*subproc.ScanResults, error) {
	carp := v1.Carp{}
	carp.Kind = kind
	carp.Name = name
	mnf, err := c.Data.GetResourceYAML(ns, &carp)
	if err != nil {
		return nil, err
	}

	fname, fclose, err := utils.TempFile(mnf)
	defer fclose()

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "cli", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res := subproc.ScanResults{}
	line, out, found := strings.Cut(out, "\n")
	if found {
		_ = line
	}

	res.OrigReport = out

	return &res, nil
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
