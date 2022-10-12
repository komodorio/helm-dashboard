package scanners

import (
	"encoding/json"
	"github.com/aquasecurity/trivy/pkg/k8s/report"
	tplReport "github.com/aquasecurity/trivy/pkg/report"
	"github.com/aquasecurity/trivy/pkg/types"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"os"
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
	resources, err := c.Data.RevisionManifestsParsed(qp.Namespace, qp.Name, qp.Revision)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{}

	passed := report.Report{}
	failed := report.Report{}
	for _, res := range resources { // TODO: this loop is long, report progress back to UI
		cmd := []string{"trivy", "kubernetes", "--format", "json", "--report", "all", "--no-progress",
			"--context", c.Data.KubeContext, "--namespace", qp.Namespace, res.Kind + "/" + res.Name}
		out, err := utils.RunCommand(cmd, nil)
		if err != nil {
			return nil, err
		}

		rep := report.Report{}
		err = json.Unmarshal([]byte(out), &rep)
		if err != nil {
			return nil, err
		}

		if rep.Failed() {
			failed.Misconfigurations = append(failed.Misconfigurations, rep.Misconfigurations...)
			failed.Vulnerabilities = append(failed.Vulnerabilities, rep.Vulnerabilities...)
		} else {
			passed.Misconfigurations = append(passed.Misconfigurations, rep.Misconfigurations...)
			passed.Vulnerabilities = append(passed.Vulnerabilities, rep.Vulnerabilities...)
		}
	}

	res.OrigReport = failed
	summarize(res, passed.Vulnerabilities)
	summarize(res, passed.Misconfigurations)
	summarize(res, failed.Vulnerabilities)
	summarize(res, failed.Misconfigurations)

	iow, err := os.OpenFile("/tmp/123.html", os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return nil, err
	}
	defer iow.Close()

	tpl, err := ioutil.ReadFile("/usr/local/share/trivy/templates/html.tpl")
	if err != nil {
		return nil, err
	}

	wrt, err := tplReport.NewTemplateWriter(iow, string(tpl))
	if err != nil {
		return nil, err
	}

	err = wrt.Write(reportToReport(&failed))
	if err != nil {
		return nil, err
	}

	return res, nil
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
