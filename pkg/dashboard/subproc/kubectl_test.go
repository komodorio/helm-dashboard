package subproc

import (
	"testing"
)

func TestK8s(t *testing.T) {
	helmConfig, err := NewHelmConfig("", "")
	if err != nil {
		t.Fatal(err)
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
