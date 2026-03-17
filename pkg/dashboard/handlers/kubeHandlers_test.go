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

func findHDHealth(s *v1.CarpStatus) *v1.CarpCondition {
	for i, c := range s.Conditions {
		if c.Type == "hdHealth" {
			return &s.Conditions[i]
		}
	}
	return nil
}
