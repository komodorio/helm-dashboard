package scanners

import (
	"github.com/komodorio/helm-dashboard/pkg/dashboard/subproc"
	"github.com/komodorio/helm-dashboard/pkg/dashboard/utils"
	log "github.com/sirupsen/logrus"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"strconv"
	"strings"
)

type Checkov struct {
	Data *subproc.DataLayer
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

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "cli", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res := &subproc.ScanResults{}

	res.OrigReport = out

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

	cmd := []string{"checkov", "--quiet", "--soft-fail", "--framework", "kubernetes", "--output", "cli", "--file", fname}
	out, err := utils.RunCommand(cmd, nil)
	if err != nil {
		return nil, err
	}

	res, out := parseOutput(out)

	// TODO: use JSON output of checkov, list issues into table

	res.OrigReport = strings.TrimSpace(out)

	return &res, nil
}

func parseOutput(out string) (subproc.ScanResults, string) {
	res := subproc.ScanResults{}
	_, out, _ = strings.Cut(out, "\n")         // kubernetes scan results:
	_, out, _ = strings.Cut(out, "\n")         // empty line
	line, out, found := strings.Cut(out, "\n") // status line
	if found {
		parts := strings.FieldsFunc(line, func(r rune) bool {
			return r == ':' || r == ','
		})
		if cnt, err := strconv.Atoi(strings.TrimSpace(parts[1])); err == nil {
			res.PassedCount = cnt
		} else {
			log.Warnf("Failed to parse Checkov output: %s", err)
		}
		if cnt, err := strconv.Atoi(strings.TrimSpace(parts[3])); err == nil {
			res.FailedCount = cnt
		} else {
			log.Warnf("Failed to parse Checkov output: %s", err)
		}
	} else {
		log.Warnf("Failed to parse Checkov output")
	}
	return res, out
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
