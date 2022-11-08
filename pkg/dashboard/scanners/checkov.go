package scanners

import (
	"encoding/json"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	"github.com/olekukonko/tablewriter"
	log "github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"strings"
)

type Checkov struct {
	Data *subproc.DataLayer
}

func (c *Checkov) ManifestIsScannable() bool {
	return true
}

func (c *Checkov) SupportedResourceKinds() []string {
	// from https://github.com/bridgecrewio/checkov//blob/master/docs/5.Policy%20Index/kubernetes.md
	return []string{
		"AdmissionConfiguration",
		"ClusterRole",
		"ClusterRoleBinding",
		"ConfigMap",
		"CronJob",
		"DaemonSet",
		"Deployment",
		"DeploymentConfig",
		"Ingress",
		"Job",
		"Pod",
		"PodSecurityPolicy",
		"PodTemplate",
		"Policy",
		"ReplicaSet",
		"ReplicationController",
		"Role",
		"RoleBinding",
		"Secret",
		"Service",
		"ServiceAccount",
		"StatefulSet",
	}
}

func (c *Checkov) Name() string {
	return "Checkov"
}

func (c *Checkov) Test() bool {
	utils.FailLogLevel = log.DebugLevel
	defer func() { utils.FailLogLevel = log.WarnLevel }()

	res, err := utils.RunCommand([]string{"checkov", "--version"}, nil)
	if err != nil {
		return false
	}
	log.Infof("Discovered Checkov version: %s", strings.TrimSpace(res))
	return true
}

func (c *Checkov) ScanManifests(mnf string) (*subproc.ScanResults, error) {
	fname, fclose, err := utils.TempFile(mnf)
	if err != nil {
		return nil, err
	}
	defer fclose()

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "json", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{}

	err = json.Unmarshal([]byte(out), res.OrigReport)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (c *Checkov) ScanResource(ns string, kind string, name string) (*subproc.ScanResults, error) {
	carp := v1.Carp{}
	carp.Kind = kind
	carp.Name = name
	mnf, err := c.Data.GetResourceYAML(ns, &carp)
	if err != nil {
		return nil, err
	}

	fname, fclose, err := utils.TempFile(mnf)
	if err != nil {
		return nil, err
	}
	defer fclose()

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "json", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	cr := CheckovReport{}
	err = json.Unmarshal([]byte(out), &cr)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{
		PassedCount: cr.Summary.Passed,
		FailedCount: cr.Summary.Failed,
		OrigReport:  checkovReportTable(&cr),
	}

	return res, nil
}

func checkovReportTable(c *CheckovReport) string {
	data := [][]string{}
	for _, item := range c.Results.FailedChecks {
		data = append(data, []string{item.Id, item.Name + "\n", item.Guideline})
	}

	tableString := &strings.Builder{}
	table := tablewriter.NewWriter(tableString)
	table.SetHeader([]string{"ID", "Name", "Guideline"})
	table.SetBorder(false)
	table.SetColWidth(64)
	table.AppendBulk(data)
	table.Render()
	return tableString.String()
}

type CheckovReport struct {
	Summary CheckovSummary `json:"summary"`
	Results CheckovResults `json:"results"`
}

type CheckovSummary struct {
	Failed        int `json:"failed"`
	Passed        int `json:"passed"`
	ResourceCount int `json:"resource_count"`
	// parsing errors?
	// skipped ?
}

type CheckovResults struct {
	FailedChecks []CheckovCheck `json:"failed_checks"`
}

type CheckovCheck struct {
	Id            string `json:"check_id"`
	BcId          string `json:"bc_check_id"`
	Name          string `json:"check_name"`
	Resource      string `json:"resource"`
	Guideline     string `json:"guideline"`
	FileLineRange []int  `json:"file_line_range"`
}
