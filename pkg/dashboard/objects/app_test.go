package objects

import (
	"errors"
	"strings"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
)

func TestNewApplicationHelmConfigErrorIncludesNamespace(t *testing.T) {
	settings := cli.New()
	settings.SetNamespace("target-namespace")

	wantErr := errors.New("config unavailable")
	failingGetter := func(ns string) (*action.Configuration, error) {
		return nil, wantErr
	}

	app, err := NewApplication(settings, failingGetter, nil, false)
	if app != nil {
		t.Fatal("expected a nil application when the helm config getter fails")
	}
	if err == nil {
		t.Fatal("expected an error when the helm config getter fails")
	}

	if !strings.Contains(err.Error(), "failed to get helm config for namespace") {
		t.Fatalf("unexpected error message: %q", err.Error())
	}
	if !strings.Contains(err.Error(), "target-namespace") {
		t.Errorf("error %q does not include the namespace passed to the helm config getter", err.Error())
	}
}
