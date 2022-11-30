package subproc

import (
	"encoding/json"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"os"
	"regexp"
	"sort"
	"strings"
)

func (d *DataLayer) runCommandKubectl(cmd ...string) (string, error) {
	if d.Kubectl == "" {
		d.Kubectl = "kubectl"
	}

	cmd = append([]string{d.Kubectl}, cmd...)

	if d.KubeContext != "" {
		cmd = append(cmd, "--context", d.KubeContext)
	}

	return d.runCommand(cmd...)
}

type KubeContext struct {
	IsCurrent bool
	Name      string
	Cluster   string
	AuthInfo  string
	Namespace string
}

func (d *DataLayer) ListContexts() (res []KubeContext, err error) {
	res = []KubeContext{}

	if os.Getenv("HD_CLUSTER_MODE") != "" {
		return res, nil
	}

	out, err := d.runCommandKubectl("config", "get-contexts")
	if err != nil {
		return nil, err
	}

	// kubectl has no JSON output for it, we'll have to do custom text parsing
	lines := strings.Split(out, "\n")

	// find field positions
	fields := regexp.MustCompile(`(\w+\s+)`).FindAllString(lines[0], -1)
	cur := len(fields[0])
	name := cur + len(fields[1])
	cluster := name + len(fields[2])
	auth := cluster + len(fields[3])

	// read items
	for _, line := range lines[1:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		res = append(res, KubeContext{
			IsCurrent: strings.TrimSpace(line[0:cur]) == "*",
			Name:      strings.TrimSpace(line[cur:name]),
			Cluster:   strings.TrimSpace(line[name:cluster]),
			AuthInfo:  strings.TrimSpace(line[cluster:auth]),
			Namespace: strings.TrimSpace(line[auth:]),
		})
	}

	return res, nil
}

type NamespaceElement struct {
	Items []struct {
		Metadata struct {
			Name string `json:"name"`
		} `json:"metadata"`
	} `json:"items"`
}

func (d *DataLayer) GetNameSpaces() (res *NamespaceElement, err error) {
	out, err := d.runCommandKubectl("get", "namespaces", "-o", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d *DataLayer) GetResource(namespace string, def *v1.Carp) (*v1.Carp, error) {
	out, err := d.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "json")
	if err != nil {
		if strings.HasSuffix(strings.TrimSpace(err.Error()), " not found") {
			return &v1.Carp{
				Status: v1.CarpStatus{
					Phase:   "NotFound",
					Message: err.Error(),
					Reason:  "not found",
				},
			}, nil
		} else {
			return nil, err
		}
	}

	var res v1.Carp
	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	sort.Slice(res.Status.Conditions, func(i, j int) bool {
		// some condition types always bubble up
		if res.Status.Conditions[i].Type == "Available" {
			return false
		}

		if res.Status.Conditions[j].Type == "Available" {
			return true
		}

		t1 := res.Status.Conditions[i].LastTransitionTime
		t2 := res.Status.Conditions[j].LastTransitionTime
		return t1.Time.Before(t2.Time)
	})

	return &res, nil
}

func (d *DataLayer) GetResourceYAML(namespace string, def *v1.Carp) (string, error) {
	out, err := d.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "yaml")
	if err != nil {
		return "", err
	}

	return out, nil
}

func (d *DataLayer) DescribeResource(namespace string, kind string, name string) (string, error) {
	out, err := d.runCommandKubectl("describe", strings.ToLower(kind), name, "--namespace", namespace)
	if err != nil {
		return "", err
	}
	return out, nil
}
