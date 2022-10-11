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

func (c *Trivy) Run(qp *utils.QueryProps) (*subproc.ScanResults, error) {
	resources, err := c.Data.RevisionManifestsParsed(qp.Namespace, qp.Name, qp.Revision)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{}

	for _, res := range resources {
		cmd := []string{"trivy", "kubernetes", "--format", "json", "--report", "all", "--no-progress", "--context", c.Data.KubeContext, "--namespace", qp.Namespace, res.Kind + "/" + res.Name}
		out, err := utils.RunCommand(cmd, nil)
		if err != nil {
			return nil, err
		}

		rep := TrivyReport{}
		err = json.Unmarshal([]byte(out), &rep)
		if err != nil {
			return nil, err
		}
	}

	return res, nil
}

type TrivyReport struct {
}
