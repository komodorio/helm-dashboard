package env

import (
	"os"
	"slices"
)

func ParseEnvAsBool(envKey string, envDef bool) bool {
	validSettableValues := []string{"false", "true", "0", "1"}
	envValue := os.Getenv(envKey)
	if slices.Contains(validSettableValues, envValue) {
		return envValue == "true" || envValue == "1"
	} else {
		return envDef
	}
}
