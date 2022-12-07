package subproc

import (
	"encoding/json"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/client-go/tools/clientcmd/api"
	"os"
	"sort"
	"strings"
)

type KubeContext struct {
	IsCurrent bool
	Name      string
	Cluster   string
	AuthInfo  string
	Namespace string
}

type K8s struct {
	KubectlConfig *api.Config
}

func (k *K8s) ListContexts() ([]KubeContext, error) {
	res := []KubeContext{}
	for name, ctx := range k.KubectlConfig.Contexts {
		res = append(res, KubeContext{
			IsCurrent: k.KubectlConfig.CurrentContext == name,
			Name:      name,
			Cluster:   ctx.Cluster,
			AuthInfo:  ctx.AuthInfo,
			Namespace: ctx.Namespace,
		})
	}

	res = []KubeContext{}

	if os.Getenv("HD_CLUSTER_MODE") != "" {
		return res, nil
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

func (k *K8s) GetNameSpaces() (res *NamespaceElement, err error) {
	out, err := k.runCommandKubectl("get", "namespaces", "-o", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (k *K8s) GetResource(namespace string, def *v1.Carp) (*v1.Carp, error) {
	out, err := k.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "json")
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

func (k *K8s) GetResourceYAML(namespace string, def *v1.Carp) (string, error) {
	out, err := k.runCommandKubectl("get", strings.ToLower(def.Kind), def.Name, "--namespace", namespace, "--output", "yaml")
	if err != nil {
		return "", err
	}

	return out, nil
}

func (k *K8s) DescribeResource(namespace string, kind string, name string) (string, error) {
	out, err := k.runCommandKubectl("describe", strings.ToLower(kind), name, "--namespace", namespace)
	if err != nil {
		return "", err
	}
	return out, nil
}
