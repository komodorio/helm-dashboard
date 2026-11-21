package handlers

import (
	"testing"

	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

func TestEnhanceStatus_ExternalSecret_Ready(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "Ready", Status: "True", Reason: "SecretSynced", Message: "Secret was synced"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Healthy {
		t.Errorf("expected Healthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_ExternalSecret_NotReady(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "Ready", Status: "False", Reason: "SecretSyncError", Message: "could not sync secret"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Unhealthy {
		t.Errorf("expected Unhealthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_Job_Complete(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "Complete", Status: "True", Reason: "JobComplete", Message: "Job completed"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Healthy {
		t.Errorf("expected Healthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_Job_Failed(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "Failed", Status: "True", Reason: "BackoffLimitExceeded", Message: "Job has reached the specified backoff limit"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Unhealthy {
		t.Errorf("expected Unhealthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_HPA_AbleToScale(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "AbleToScale", Status: "True", Reason: "ReadyForNewScale", Message: "recommended size matches current size"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Healthy {
		t.Errorf("expected Healthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_HPA_UnableToScale(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Conditions: []v1.CarpCondition{
				{Type: "AbleToScale", Status: "False", Reason: "FailedGetScale", Message: "the HPA controller was unable to get the target's current scale"},
			},
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Unhealthy {
		t.Errorf("expected Unhealthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_Namespace_Active(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Phase: "Active",
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Healthy {
		t.Errorf("expected Healthy, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_Namespace_Terminating(t *testing.T) {
	res := &v1.Carp{
		Status: v1.CarpStatus{
			Phase: "Terminating",
		},
	}
	s := EnhanceStatus(res, nil)
	hdCond := findHDHealth(s)
	if hdCond == nil {
		t.Fatal("expected hdHealth condition")
	}
	if hdCond.Status != Progressing {
		t.Errorf("expected Progressing, got %s", hdCond.Status)
	}
}

func TestEnhanceStatus_Pod_Phases(t *testing.T) {
	podReady := func(status v1.ConditionStatus) []v1.CarpCondition {
		return []v1.CarpCondition{
			{Type: "Initialized", Status: "True"},
			{Type: "Ready", Status: status},
			{Type: "ContainersReady", Status: status},
			{Type: "PodScheduled", Status: "True"},
		}
	}

	tests := []struct {
		name   string
		status v1.CarpStatus
		want   v1.ConditionStatus
	}{
		{"running and ready", v1.CarpStatus{Phase: "Running", Conditions: podReady("True")}, Healthy},
		{"running but not ready", v1.CarpStatus{Phase: "Running", Conditions: podReady("False")}, Unhealthy},
		{"succeeded", v1.CarpStatus{Phase: "Succeeded"}, Healthy},
		{"failed", v1.CarpStatus{Phase: "Failed"}, Unhealthy},
		{"pending", v1.CarpStatus{Phase: "Pending"}, Progressing},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := EnhanceStatus(&v1.Carp{Status: tt.status}, nil)
			hdCond := findHDHealth(s)
			if hdCond == nil {
				t.Fatal("expected hdHealth condition")
			}
			if hdCond.Status != tt.want {
				t.Errorf("expected %s, got %s", tt.want, hdCond.Status)
			}
		})
	}
}

func findHDHealth(s *v1.CarpStatus) *v1.CarpCondition {
	for i, c := range s.Conditions {
		if c.Type == "hdHealth" {
			return &s.Conditions[i]
		}
	}
	return nil
}
