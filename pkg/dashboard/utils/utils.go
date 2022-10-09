package utils

import (
	"bytes"
	"errors"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"
)

type ControlChan = chan struct{}

func ChartAndVersion(x string) (string, string, error) {
	lastInd := strings.LastIndex(x, "-")
	if lastInd < 0 {
		return "", "", errors.New("can't parse chart version string")
	}

	return x[:lastInd], x[lastInd+1:], nil
}

func TempFile(txt string) (string, func(), error) {
	file, err := ioutil.TempFile("", "helm_dahsboard_")
	if err != nil {
		return "", nil, err
	}

	err = ioutil.WriteFile(file.Name(), []byte(txt), 0600)
	if err != nil {
		return "", nil, err
	}

	return file.Name(), func() { os.Remove(file.Name()) }, nil
}

type CmdError struct {
	Command   []string
	OrigError error
	StdErr    []byte
}

func (e CmdError) Error() string {
	//return fmt.Sprintf("failed to run command %s:\nError: %s\nSTDERR:%s", e.Command, e.OrigError, e.StdErr)
	return string(e.StdErr)
}

func RunCommand(cmd []string, env map[string]string) (string, error) {
	prog := exec.Command(cmd[0], cmd[1:]...)
	prog.Env = os.Environ()

	for k, v := range env {
		prog.Env = append(prog.Env, k+"="+v)
	}

	var stdout bytes.Buffer
	prog.Stdout = &stdout

	var stderr bytes.Buffer
	prog.Stderr = &stderr

	if err := prog.Run(); err != nil {
		log.Warnf("Failed command: %s", cmd)
		serr := stderr.Bytes()
		if serr != nil {
			log.Warnf("STDERR:\n%s", serr)
		}
		if eerr, ok := err.(*exec.ExitError); ok {
			return "", CmdError{
				Command:   cmd,
				StdErr:    serr,
				OrigError: eerr,
			}
		}

		return "", CmdError{
			Command:   cmd,
			StdErr:    serr,
			OrigError: err,
		}
	}

	sout := stdout.Bytes()
	serr := stderr.Bytes()
	log.Debugf("Command STDOUT:\n%s", sout)
	log.Debugf("Command STDERR:\n%s", serr)
	return string(sout), nil
}
