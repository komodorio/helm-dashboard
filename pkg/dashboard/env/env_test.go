package env

import (
	"os"
	"testing"
)

func TestParseEnvAsBool(t *testing.T) {
	// value: "true" | "1", default: false -> expect true
	t.Setenv("TEST", "true")
	want := true
	if ParseEnvAsBool("TEST", false) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}
	t.Setenv("TEST", "1")
	want = true
	if ParseEnvAsBool("TEST", false) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}

	// value: "false" | "0", default: true  -> expect false
	t.Setenv("TEST", "false")
	want = false
	if ParseEnvAsBool("TEST", true) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}
	t.Setenv("TEST", "0")
	want = false
	if ParseEnvAsBool("TEST", true) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}

	// value: "" | *, default: false -> expect false
	t.Setenv("TEST", "")
	want = false
	if ParseEnvAsBool("TEST", false) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}
	t.Setenv("TEST", "10random")
	want = false
	if ParseEnvAsBool("TEST", false) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}

	// value: "" | *, default: true -> expect true
	t.Setenv("TEST", "")
	want = true
	if ParseEnvAsBool("TEST", true) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}
	t.Setenv("TEST", "10random")
	want = true
	if ParseEnvAsBool("TEST", true) != want {
		t.Errorf("Env 'TEST' value '%v' should be parsed to %v", os.Getenv("TEST"), want)
	}
}
