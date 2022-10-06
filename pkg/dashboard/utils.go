package dashboard

import (
	"errors"
	"io/ioutil"
	"os"
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

func tempFile(txt string) (string, func(), error) {
	file, err := ioutil.TempFile("", "helm_vals_")
	if err != nil {
		return "", nil, err
	}

	err = ioutil.WriteFile(file.Name(), []byte(txt), 0600)
	if err != nil {
		return "", nil, err
	}

	return file.Name(), func() { os.Remove(file.Name()) }, nil
}
