package objects

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
)

func TestNewDataLayer(t *testing.T) {
	testCases := []struct {
		name          string
		namespaces    []string
		version       string
		helmConfig    HelmConfigGetter
		devel         bool
		errorExpected bool
	}{
		{
			name:          "should return error when helm config is nil",
			namespaces:    []string{"namespace1", "namespace2"},
			version:       "1.0.0",
			helmConfig:    nil,
			devel:         false,
			errorExpected: true,
		},
		{
			name: "should return data layer when all parameters are correct",
			namespaces: []string{
				"namespace1",
				"namespace2",
			},
			version: "1.0.0",
			helmConfig: func(sett *cli.EnvSettings, ns string) (*action.Configuration, error) {
				return &action.Configuration{}, nil
			},
			devel:         false,
			errorExpected: false,
		},
	}
	for _, tt := range testCases {
		t.Run(tt.name, func(t *testing.T) {
			dl, err := NewDataLayer(tt.namespaces, tt.version, tt.helmConfig, tt.devel)
			if tt.errorExpected {
				assert.Error(t, err, "Expected error but got nil")
			} else {
				assert.Nil(t, err, "NewDataLayer returned an error: %v", err)
				assert.NotNil(t, dl, "NewDataLayer returned nil")
				assert.Equal(t, tt.namespaces, dl.Namespaces, "NewDataLayer returned incorrect namespaces: %v", dl.Namespaces)
				assert.NotNil(t, dl.Cache, "NewDataLayer returned nil cache")
				assert.Equal(t, tt.version, dl.StatusInfo.CurVer, "NewDataLayer returned incorrect version: %v", dl.StatusInfo.CurVer)
				assert.False(t, dl.StatusInfo.Analytics, "NewDataLayer returned incorrect version: %v", dl.StatusInfo.CurVer)
				assert.NotNil(t, dl.appPerContext, "NewDataLayer returned nil appPerContext")
				assert.NotNil(t, dl.ConfGen, "NewDataLayer returned nil ConfGen")

			}
		})
	}
}
