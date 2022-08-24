package dashboard

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"os/exec"
	"regexp"
	"strings"
)

type DataLayer struct {
}

func (l *DataLayer) runCommand(cmd ...string) (string, error) {
	// TODO: --kube-context=context-name to juggle clusters
	log.Debugf("Starting command: %s", cmd)
	prog := exec.Command(cmd[0], cmd[1:]...)

	var stdout bytes.Buffer
	prog.Stdout = &stdout

	var stderr bytes.Buffer
	prog.Stderr = &stderr

	//prog.Stdout, prog.Stderr = os.Stdout, os.Stderr
	if err := prog.Run(); err != nil {
		if eerr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("failed to run command %s: %s", cmd, eerr)
		}
		return "", err
	}

	sout := stdout.Bytes()
	serr := stderr.Bytes()
	log.Debugf("Command STDOUT:\n%s", sout)
	log.Debugf("Command STDERR:\n%s", serr)
	return string(sout), nil
}

func (l *DataLayer) CheckConnectivity() error {
	contexts, err := l.ListContexts()
	if err != nil {
		return err
	}

	if len(contexts) < 1 {
		return errors.New("did not find any kubectl contexts configured")
	}

	_, err = l.runCommand("helm", "env")
	if err != nil {
		return err
	}

	return nil
}

type KubeContext struct {
	IsCurrent bool
	Name      string
	Cluster   string
	AuthInfo  string
	Namespace string
}

func (l *DataLayer) ListContexts() (res []KubeContext, err error) {
	out, err := l.runCommand("kubectl", "config", "get-contexts")
	if err != nil {
		return nil, err
	}

	// kubectl has no JSON output for it, we'll have to do custom text parsing
	lines := strings.Split(out, "\n")

	// find field positions
	fields := regexp.MustCompile(`(\w+\s+)`).FindAllString(lines[0], -1)
	cur := len(fields[0])
	name := cur + len(fields[1])
	cluster := name + len(fields[2])
	auth := cluster + len(fields[3])

	// read items
	for _, line := range lines[1:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		res = append(res, KubeContext{
			IsCurrent: strings.TrimSpace(line[0:cur]) == "*",
			Name:      strings.TrimSpace(line[cur:name]),
			Cluster:   strings.TrimSpace(line[name:cluster]),
			AuthInfo:  strings.TrimSpace(line[cluster:auth]),
			Namespace: strings.TrimSpace(line[auth:]),
		})
	}

	return res, nil
}

// unpleasant copy from Helm sources, where they have it non-public
type releaseElement struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Revision   string `json:"revision"`
	Updated    string `json:"updated"`
	Status     string `json:"status"`
	Chart      string `json:"chart"`
	AppVersion string `json:"app_version"`
}

func (l *DataLayer) ListInstalled() (res []releaseElement, err error) {
	out, err := l.runCommand("helm", "ls", "--all", "--all-namespaces", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}
