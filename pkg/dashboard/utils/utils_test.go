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
