package dashboard

import (
	"errors"
	"strings"
)

type ControlChan = chan struct{}

func chartAndVersion(x string) (string, string, error) {
	lastInd := strings.LastIndex(x, "-")
	if lastInd < 0 {
		return "", "", errors.New("can't parse chart version string")
	}

	return x[:lastInd], x[lastInd+1:], nil
}