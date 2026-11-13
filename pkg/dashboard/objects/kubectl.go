package objects

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/kube"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	testapiv1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/resource"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	describecmd "k8s.io/kubectl/pkg/cmd/describe"
	cmdutil "k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/describe"
	"k8s.io/utils/strings/slices"
)

type KubeContext struct {
	IsCurrent bool
	Name      string
	Cluster   string
	AuthInfo  string
	Namespace string
}

// maps action.RESTClientGetter into  genericclioptions.RESTClientGetter
type cfgProxyObject struct {
	Impl action.RESTClientGetter
}

func (p *cfgProxyObject) ToRESTConfig() (*rest.Config, error) {
	return p.Impl.ToRESTConfig()
}

func (p *cfgProxyObject) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	return p.Impl.ToDiscoveryClient()
}

func (p *cfgProxyObject) ToRESTMapper() (meta.RESTMapper, error) {
	return p.Impl.ToRESTMapper()
}

func (p *cfgProxyObject) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	panic("Not implemented, stub")
}

type K8s struct {
	Namespaces       []string
	Factory          kube.Factory
	RestClientGetter genericclioptions.RESTClientGetter
}

func NewK8s(helmConfig *action.Configuration, namespaces []string) (*K8s, error) {
	if helmConfig == nil || helmConfig.RESTClientGetter == nil {
		return nil, errors.New("RESTClientGetter is required to initialize K8s client")
	}
	factory := cmdutil.NewFactory(&cfgProxyObject{Impl: helmConfig.RESTClientGetter})

	return &K8s{
		Namespaces:       namespaces,
		Factory:          factory,
		RestClientGetter: factory,
	}, nil
}

func (k *K8s) GetNameSpaces() (res *corev1.NamespaceList, err error) {
	clientset, err := k.Factory.KubernetesClientSet()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get KubernetesClientSet")
	}

	lst, err := clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, errors.Wrap(err, "failed to get list of namespaces")
	}

	if !slices.Contains(k.Namespaces, "") {
		filtered := []corev1.Namespace{}
		for _, ns := range lst.Items {
			if slices.Contains(k.Namespaces, ns.Name) {
				filtered = append(filtered, ns)
			}
		}
		lst.Items = filtered
	}

	return lst, nil
}

// ExtractSecretStorageNamespaces returns a sorted slice of unique namespaces holding release secrets.
func ExtractSecretStorageNamespaces(secrets []corev1.Secret) []string {
	seen := make(map[string]bool)
	var res []string
	for _, s := range secrets {
		if s.Namespace != "" && !seen[s.Namespace] {
			seen[s.Namespace] = true
			res = append(res, s.Namespace)
		}
	}
	sort.Strings(res)
	return res
}

// ExtractConfigMapStorageNamespaces returns a sorted slice of unique namespaces holding release configmaps.
func ExtractConfigMapStorageNamespaces(cms []corev1.ConfigMap) []string {
	seen := make(map[string]bool)
	var res []string
	for _, cm := range cms {
		if cm.Namespace != "" && !seen[cm.Namespace] {
			seen[cm.Namespace] = true
			res = append(res, cm.Namespace)
		}
	}
	sort.Strings(res)
	return res
}

func (k *K8s) GetReleaseStorageNamespaces(driver string) ([]string, error) {
	if k == nil || k.Factory == nil {
		return nil, errors.New("k8s factory not initialized")
	}

	driver = strings.ToLower(strings.TrimSpace(driver))
	opts := metav1.ListOptions{
		LabelSelector: "owner=helm",
	}

	switch driver {
	case "", "secret", "secrets":
		clientset, err := k.Factory.KubernetesClientSet()
		if err != nil {
			return nil, errors.Wrap(err, "failed to get KubernetesClientSet")
		}
		secrets, err := clientset.CoreV1().Secrets("").List(context.Background(), opts)
		if err != nil {
			return nil, errors.Wrap(err, "failed to list release secrets")
		}
		return ExtractSecretStorageNamespaces(secrets.Items), nil

	case "configmap", "configmaps":
		clientset, err := k.Factory.KubernetesClientSet()
		if err != nil {
			return nil, errors.Wrap(err, "failed to get KubernetesClientSet")
		}
		cms, err := clientset.CoreV1().ConfigMaps("").List(context.Background(), opts)
		if err != nil {
			return nil, errors.Wrap(err, "failed to list release configmaps")
		}
		return ExtractConfigMapStorageNamespaces(cms.Items), nil

	default:
		log.Infof("HELM_DRIVER '%s' does not support cluster-wide storage discovery, skipping lookup", driver)
		return nil, nil
	}
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

		NewBuilder: k.Factory.NewBuilder,
	}

	o.Namespace = ns
	o.BuilderArgs = []string{kind, name}

	err := o.Run()
	if err != nil {
		return "", errorx.Decorate(err, "Failed to run describe command: %s", errout.String())
	}

	return out.String(), nil
}

func (k *K8s) GetResource(kind string, namespace string, name string) (*runtime.Object, error) {
	builder := k.Factory.NewBuilder()
	builder = builder.Unstructured().SingleResourceType()
	if namespace != "" {
		builder = builder.NamespaceParam(namespace)
	} else {
		builder = builder.DefaultNamespace()
	}

	resp := builder.Flatten().ResourceNames(kind, name).Do()
	if resp.Err() != nil {
		return nil, errorx.Decorate(resp.Err(), "failed to get k8s resource")
	}

	obj, err := resp.Object()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get k8s resulting object")
	}
	return &obj, nil
}

func (k *K8s) GetResourceInfo(kind string, namespace string, name string) (*testapiv1.Carp, error) {
	// TODO: mutex to avoid a lot of requests?
	obj, err := k.GetResource(kind, namespace, name)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get k8s object")
	}

	data, err := json.Marshal(obj)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to marshal k8s object into JSON")
	}

	ext := new(extendedCarp)
	err = json.Unmarshal(data, &ext)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to decode k8s object from JSON")
	}

	synthesizeConditions(kind, ext)

	res := &ext.Carp
	res.Status = ext.Status.CarpStatus

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

	return res, nil
}

// extendedCarp extends Carp to capture numeric status fields from DaemonSet/StatefulSet
// that are lost during standard Carp unmarshaling.
type extendedCarp struct {
	testapiv1.Carp
	Status extendedCarpStatus `json:"status,omitempty"`
}

type extendedCarpStatus struct {
	testapiv1.CarpStatus
	// DaemonSet fields
	DesiredNumberScheduled int `json:"desiredNumberScheduled,omitempty"`
	NumberReady            int `json:"numberReady,omitempty"`
	UpdatedNumberScheduled int `json:"updatedNumberScheduled,omitempty"`
	// StatefulSet fields
	Replicas        int `json:"replicas,omitempty"`
	ReadyReplicas   int `json:"readyReplicas,omitempty"`
	UpdatedReplicas int `json:"updatedReplicas,omitempty"`
}

// synthesizeConditions creates synthetic conditions for resource kinds that use
// numeric status fields instead of conditions (DaemonSet, StatefulSet).
func synthesizeConditions(kind string, ext *extendedCarp) {
	kind = strings.ToLower(kind)

	var desired, ready, updated int
	switch kind {
	case "daemonset":
		desired = ext.Status.DesiredNumberScheduled
		ready = ext.Status.NumberReady
		updated = ext.Status.UpdatedNumberScheduled
	case "statefulset":
		desired = ext.Status.Replicas
		ready = ext.Status.ReadyReplicas
		updated = ext.Status.UpdatedReplicas
	default:
		return
	}

	status := testapiv1.ConditionStatus("True")
	reason := "AllReady"
	message := fmt.Sprintf("%d/%d ready", ready, desired)

	if ready < desired {
		status = "False"
		reason = "NotAllReady"
	} else if updated < desired {
		status = "False"
		reason = "UpdateInProgress"
		message = fmt.Sprintf("%d/%d updated", updated, desired)
	}

	ext.Status.Conditions = append(ext.Status.Conditions, testapiv1.CarpCondition{
		Type:    "Available",
		Status:  status,
		Reason:  reason,
		Message: message,
	})
}

func (k *K8s) GetResourceYAML(kind string, namespace string, name string) (string, error) {
	obj, err := k.GetResource(kind, namespace, name)
	if err != nil {
		return "", errorx.Decorate(err, "failed to get k8s object")
	}

	data, err := json.Marshal(obj)
	if err != nil {
		return "", errorx.Decorate(err, "failed to marshal k8s object into JSON")
	}

	res := map[string]interface{}{}
	err = json.Unmarshal(data, &res)
	if err != nil {
		return "", errorx.Decorate(err, "failed to decode k8s object from JSON")
	}

	ydata, err := yaml.Marshal(res)
	if err != nil {
		return "", errorx.Decorate(err, "failed to marshal k8s object into JSON")
	}
	return string(ydata), nil
}
