package subproc

import (
	"context"
	"encoding/json"
	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/kube"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/resource"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
	describecmd "k8s.io/kubectl/pkg/cmd/describe"
	cmdutil "k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/describe"
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

type ProxyObject struct {
	Impl action.RESTClientGetter
}

func (p *ProxyObject) ToRESTConfig() (*rest.Config, error) {
	return p.Impl.ToRESTConfig()
}

func (p *ProxyObject) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	return p.Impl.ToDiscoveryClient()
}

func (p *ProxyObject) ToRESTMapper() (meta.RESTMapper, error) {
	return p.Impl.ToRESTMapper()
}

func (p *ProxyObject) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	panic("Not implemented, stub")
}

type K8s struct {
	KubectlConfig    *api.Config
	KubectlClient    *kube.Client
	RestClientGetter genericclioptions.RESTClientGetter
}

func NewK8s(helmConfig *action.Configuration) (*K8s, error) {
	cfg, err := clientcmd.NewDefaultPathOptions().GetStartingConfig()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get kubectl config")
	}

	client, ok := helmConfig.KubeClient.(*kube.Client)
	if !ok {
		return nil, errors.New("Failed to cast Helm's KubeClient into kube.Client")
	}

	//ConfigFlags:
	factory := cmdutil.NewFactory(&ProxyObject{Impl: helmConfig.RESTClientGetter})

	return &K8s{
		KubectlConfig:    cfg,
		KubectlClient:    client,
		RestClientGetter: factory,
	}, nil
}

func (k *K8s) ListContexts() ([]KubeContext, error) {
	res := []KubeContext{}

	if os.Getenv("HD_CLUSTER_MODE") != "" {
		return res, nil
	}

	for name, ctx := range k.KubectlConfig.Contexts {
		res = append(res, KubeContext{
			IsCurrent: k.KubectlConfig.CurrentContext == name,
			Name:      name,
			Cluster:   ctx.Cluster,
			AuthInfo:  ctx.AuthInfo,
			Namespace: ctx.Namespace,
		})
	}

	return res, nil
}

func (k *K8s) GetNameSpaces() (res *corev1.NamespaceList, err error) {
	clientset, err := k.KubectlClient.Factory.KubernetesClientSet()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get KubernetesClientSet")
	}

	lst, err := clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, errors.Wrap(err, "failed to get list of namespaces")
	}

	return lst, nil
}

func (k *K8s) GetResource(namespace string, def string) (*v1.Carp, error) {
	//resp := k.KubectlClient.RestClientGetter.NewBuilder().NamespaceParam(namespace).ResourceNames(def.Kind, def.Name).Do()
	///_ = resp
	// FIXME what's next

	return nil, nil
}

func (k *K8s) DescribeResource(kind string, ns string, name string) (string, error) {
	log.Debugf("Describing resource: %s %s in %s", kind, name, ns)
	streams, _, out, errout := genericclioptions.NewTestIOStreams()
	o := &describecmd.DescribeOptions{
		Describer: func(mapping *meta.RESTMapping) (describe.ResourceDescriber, error) {
			return describe.DescriberFn(k.RestClientGetter, mapping)
		},
		FilenameOptions: &resource.FilenameOptions{},
		DescriberSettings: &describe.DescriberSettings{
			ShowEvents: true,
			ChunkSize:  cmdutil.DefaultChunkSize,
		},

		IOStreams: streams,

		NewBuilder: k.KubectlClient.Factory.NewBuilder,
	}

	o.Namespace = ns
	o.BuilderArgs = []string{kind, name}

	err := o.Run()
	if err != nil {
		return "", errorx.Decorate(err, "Failed to run describe command: %s", errout.String())
	}

	return out.String(), nil
}
