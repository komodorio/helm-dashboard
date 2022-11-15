package utils

import (
	"bytes"
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

var FailLogLevel = log.WarnLevel // allows to suppress error logging in some situations

type ControlChan = chan struct{}

func ChartAndVersion(x string) (string, string, error) {
	strs := strings.Split(x, "-")
	lens := len(strs)
	if lens < 2 {
		return "", "", errors.New("can't parse chart version string")
	} else if lens == 2 {
		return strs[0], strs[1], nil
	} else {
		// semver2 regex , add optional  v prefix
		re := regexp.MustCompile(`v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?`)
		match := re.FindString(x)
		lastInd := strings.LastIndex(x, match)
		return x[:lastInd-1], match, nil
	}
}

func TempFile(txt string) (string, func(), error) {
	file, err := ioutil.TempFile("", "helm_dahsboard_*.yaml")
	if err != nil {
		return "", nil, err
	}

	err = ioutil.WriteFile(file.Name(), []byte(txt), 0600)
	if err != nil {
		return "", nil, err
	}

	return file.Name(), func() { _ = os.Remove(file.Name()) }, nil
}

type CmdError struct {
	Command   []string
	OrigError error
	StdErr    string
}

func (e CmdError) Error() string {
	//return fmt.Sprintf("failed to run command %s:\nError: %s\nSTDERR:%s", e.Command, e.OrigError, e.StdErr)
	return string(e.StdErr)
}

func RunCommand(cmd []string, env map[string]string) (string, error) {
	log.Debugf("Starting command: %s", cmd)
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
		log.StandardLogger().Logf(FailLogLevel, "Failed command: %s", cmd)
		serr := stderr.Bytes()
		if serr != nil {
			log.StandardLogger().Logf(FailLogLevel, "STDERR:\n%s", serr)
		}
		if eerr, ok := err.(*exec.ExitError); ok {
			return "", CmdError{
				Command:   cmd,
				StdErr:    string(serr),
				OrigError: eerr,
			}
		}

		return "", CmdError{
			Command:   cmd,
			StdErr:    string(serr),
			OrigError: err,
		}
	}

	sout := stdout.Bytes()
	serr := stderr.Bytes()
	log.Debugf("Command STDOUT:\n%s", sout)
	log.Debugf("Command STDERR:\n%s", serr)
	return string(sout), nil
}

type QueryProps struct {
	Namespace string
	Name      string
	Revision  int
}

func GetQueryProps(c *gin.Context, revRequired bool) (*QueryProps, error) {
	qp := QueryProps{}

	qp.Namespace = c.Query("namespace")
	qp.Name = c.Query("name")
	if qp.Name == "" {
		return nil, errors.New("missing required query string parameter: name")
	}

	cRev, err := strconv.Atoi(c.Query("revision"))
	if err != nil && revRequired {
		return nil, err
	}
	qp.Revision = cRev

	return &qp, nil
}
