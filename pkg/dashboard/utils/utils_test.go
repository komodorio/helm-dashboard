package utils

import (
	"github.com/gin-gonic/gin"
	"net/http/httptest"
	"testing"
)

func TestGetQueryProps(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name        string
		endpoint    string
		revRequired bool
		wantErr     bool
	}{
		{
			name:        "Get query props - all set with revRequired true",
			wantErr:     false,
			revRequired: true,
			endpoint:    "/api/v1/namespaces/komodorio/charts?name=testing&namespace=testing&revision=1",
		},
		{
			name:        "Get query props - no revision with revRequired true",
			wantErr:     true,
			revRequired: true,
			endpoint:    "/api/v1/namespaces/komodorio/charts?name=testing&namespace=testing",
		},
		{
			name:        "Get query props - no namespace with revRequired true",
			wantErr:     false,
			revRequired: true,
			endpoint:    "/api/v1/namespaces/komodorio/charts?name=testing&revision=1",
		},
		{
			name:        "Get query props - no name with revRequired true",
			wantErr:     true,
			revRequired: true,
			endpoint:    "/api/v1/namespaces/komodorio/charts?namespace=testing&revision=1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("GET", tt.endpoint, nil)
			_, err := GetQueryProps(c, tt.revRequired)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetQueryProps() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
		})
	}
}

func TestChartAndVersion(t *testing.T) {
	tests := []struct {
		name      string
		params    string
		wantChart string
		wantVer   string
		wantError bool
	}{
		{
			name:      "Chart and version - successfully parsing chart and version",
			params:    "chart-1.0.0",
			wantChart: "chart",
			wantVer:   "1.0.0",
			wantError: false,
		},
		{
			name:      "Chart and version - parsing chart without version",
			params:    "chart",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a, b, err := ChartAndVersion(tt.params)
			if (err != nil) != tt.wantError {
				t.Errorf("ChartAndVersion() error = %v, wantErr %v", err, tt.wantError)
				return
			}

			if a != tt.wantChart {
				t.Errorf("ChartAndVersion() got = %v, want %v", a, tt.wantChart)
			}

			if b != tt.wantVer {
				t.Errorf("ChartAndVersion() got1 = %v, want %v", b, tt.wantVer)
			}
		})
	}
}
