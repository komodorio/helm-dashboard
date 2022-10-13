package scanners

import (
	"github.com/aquasecurity/trivy/pkg/k8s/report"
	"github.com/aquasecurity/trivy/pkg/types"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"strconv"
	"strings"
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

func (c *Trivy) Run(qp *utils.QueryProps) (*subproc.ScanResults, error) {
	return nil, nil
}

func (c *Trivy) scanResource(ns string, kind string, name string) (string, error) {
	cmd := []string{"trivy", "kubernetes", "--quiet", "--format", "table", "--report", "all", "--no-progress",
		"--context", c.Data.KubeContext, "--namespace", ns, kind + "/" + name}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return "", err
	}

	return out, nil
}

func (c *Trivy) RunResource(ns string, kind string, name string) (*subproc.ScanResults, error) {
	res := subproc.ScanResults{}
	resource, err := c.scanResource(ns, kind, name)
	if err != nil {
		return nil, err
	}

	for _, line := range strings.Split(resource, "\n") {
		if strings.HasPrefix(line, "Tests:") {
			parts := strings.FieldsFunc(line, func(r rune) bool {
				return r == ':' || r == ',' || r == ')'
			})

			if cnt, err := strconv.Atoi(strings.TrimSpace(parts[2])); err == nil {
				res.PassedCount += cnt
			} else {
				log.Warnf("Failed to parse Trivy output: %s", err)
			}

			if cnt, err := strconv.Atoi(strings.TrimSpace(parts[4])); err == nil {
				res.FailedCount += cnt
			} else {
				log.Warnf("Failed to parse Trivy output: %s", err)
			}
		}

		if strings.HasPrefix(line, "Total:") {
			parts := strings.FieldsFunc(line, func(r rune) bool {
				return r == ':' || r == ',' || r == '('
			})

			if cnt, err := strconv.Atoi(strings.TrimSpace(parts[1])); err == nil {
				res.FailedCount += cnt
			} else {
				log.Warnf("Failed to parse Trivy output: %s", err)
			}
		}

	}

	res.OrigReport = resource

	return &res, nil
}

func reportToReport(failed *report.Report) types.Report {
	result := types.Report{
		Results: make(types.Results, 0),
	}

	for _, a := range failed.Misconfigurations {
		result.Results = append(result.Results, a.Results...)
	}

	for _, a := range failed.Vulnerabilities {
		result.Results = append(result.Results, a.Results...)
	}

	return result
}

func summarize(sum *subproc.ScanResults, rep []report.Resource) {
	for _, res := range rep {
		for _, r := range res.Results {
			if r.MisconfSummary != nil {
				sum.FailedCount += r.MisconfSummary.Exceptions
				sum.FailedCount += r.MisconfSummary.Failures
				sum.PassedCount += r.MisconfSummary.Successes
			}

			sum.FailedCount += len(r.Vulnerabilities)
		}
	}
}
