package objects

import (
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	"io/ioutil"
	"testing"
)

func TestK8s(t *testing.T) {
	registryClient, err := registry.NewClient()
	if err != nil {
		t.Fatal(err)
	}

	helmConfig := &action.Configuration{
		Releases:       storage.Init(driver.NewMemory()),
		KubeClient:     &kubefake.FailingKubeClient{PrintingKubeClient: kubefake.PrintingKubeClient{Out: ioutil.Discard}},
		Capabilities:   chartutil.DefaultCapabilities,
		RegistryClient: registryClient,
		Log:            log.Debugf,
	}

	k8s, err := NewK8s(helmConfig)
	if err != nil {
		t.Fatal(err)
	}

	spaces, err := k8s.GetNameSpaces()
	if err != nil {
		t.Fatal(err)
	}

	if len(spaces.Items) < 1 {
		t.Fatal("Should nave some")
	}
	t.Log(spaces.Items)

	descr, err := k8s.DescribeResource("namespace", spaces.Items[0].Namespace, spaces.Items[0].Name)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(descr)

	res, err := k8s.GetResource("namespace", spaces.Items[0].Namespace, spaces.Items[0].Name)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(res)

	//config, err := actionConfig.RESTClientGetter.ToRESTConfig()
	//forConfig, err := dynamic.NewForConfig(config)
	//if err != nil {
	//	forConfig.Resource().Get()
	//}
}
