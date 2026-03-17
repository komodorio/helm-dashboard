package objects

import (
	"testing"

	testapiv1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

func TestSynthesizeConditions_DaemonSet_AllReady(t *testing.T) {
	ext := &extendedCarp{
		Status: extendedCarpStatus{
			DesiredNumberScheduled: 3,
			NumberReady:            3,
			UpdatedNumberScheduled: 3,
		},
	}
	synthesizeConditions("DaemonSet", ext)
	cond := findCondition(ext.Status.Conditions, "Available")
	if cond == nil {
		t.Fatal("expected Available condition")
	}
	if cond.Status != "True" {
		t.Errorf("expected True, got %s", cond.Status)
	}
	if cond.Reason != "AllReady" {
		t.Errorf("expected AllReady, got %s", cond.Reason)
	}
}

func TestSynthesizeConditions_DaemonSet_NotReady(t *testing.T) {
	ext := &extendedCarp{
		Status: extendedCarpStatus{
			DesiredNumberScheduled: 3,
			NumberReady:            1,
			UpdatedNumberScheduled: 3,
		},
	}
	synthesizeConditions("DaemonSet", ext)
	cond := findCondition(ext.Status.Conditions, "Available")
	if cond == nil {
		t.Fatal("expected Available condition")
	}
	if cond.Status != "False" {
		t.Errorf("expected False, got %s", cond.Status)
	}
	if cond.Reason != "NotAllReady" {
		t.Errorf("expected NotAllReady, got %s", cond.Reason)
	}
}

func TestSynthesizeConditions_StatefulSet_AllReady(t *testing.T) {
	ext := &extendedCarp{
		Status: extendedCarpStatus{
			Replicas:        3,
			ReadyReplicas:   3,
			UpdatedReplicas: 3,
		},
	}
	synthesizeConditions("StatefulSet", ext)
	cond := findCondition(ext.Status.Conditions, "Available")
	if cond == nil {
		t.Fatal("expected Available condition")
	}
	if cond.Status != "True" {
		t.Errorf("expected True, got %s", cond.Status)
	}
}

func TestSynthesizeConditions_StatefulSet_UpdateInProgress(t *testing.T) {
	ext := &extendedCarp{
		Status: extendedCarpStatus{
			Replicas:        3,
			ReadyReplicas:   3,
			UpdatedReplicas: 1,
		},
	}
	synthesizeConditions("StatefulSet", ext)
	cond := findCondition(ext.Status.Conditions, "Available")
	if cond == nil {
		t.Fatal("expected Available condition")
	}
	if cond.Status != "False" {
		t.Errorf("expected False, got %s", cond.Status)
	}
	if cond.Reason != "UpdateInProgress" {
		t.Errorf("expected UpdateInProgress, got %s", cond.Reason)
	}
}

func TestSynthesizeConditions_OtherKind_NoCondition(t *testing.T) {
	ext := &extendedCarp{}
	synthesizeConditions("Deployment", ext)
	if len(ext.Status.Conditions) != 0 {
		t.Errorf("expected no conditions for Deployment, got %d", len(ext.Status.Conditions))
	}
}

func findCondition(conditions []testapiv1.CarpCondition, condType string) *testapiv1.CarpCondition {
	for i, c := range conditions {
		if string(c.Type) == condType {
			return &conditions[i]
		}
	}
	return nil
}
