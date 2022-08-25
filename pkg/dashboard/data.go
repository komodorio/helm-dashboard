package dashboard

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"os"
	"os/exec"
	"regexp"
	"strings"
)

type DataLayer struct {
	KubeContext string
	Helm        string
	Kubectl     string
}

func (l *DataLayer) runCommand(cmd ...string) (string, error) {
	// TODO: --kube-context=context-name to juggle clusters
	log.Debugf("Starting command: %s", cmd)
	prog := exec.Command(cmd[0], cmd[1:]...)
	prog.Env = os.Environ()
	prog.Env = append(prog.Env, "HELM_KUBECONTEXT="+l.KubeContext)

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

func (l *DataLayer) runCommandHelm(cmd ...string) (string, error) {
	if l.Helm == "" {
		l.Helm = "helm"
	}

	cmd = append([]string{l.Helm}, cmd...)
	if l.KubeContext != "" {
		cmd = append(cmd, "--kube-context", l.KubeContext)
	}

	return l.runCommand(cmd...)
}

func (l *DataLayer) runCommandKubectl(cmd ...string) (string, error) {
	if l.Kubectl == "" {
		l.Kubectl = "kubectl"
	}

	cmd = append([]string{l.Kubectl}, cmd...)

	if l.KubeContext != "" {
		cmd = append(cmd, "--context", l.KubeContext)
	}

	return l.runCommand(cmd...)
}

func (l *DataLayer) CheckConnectivity() error {
	contexts, err := l.ListContexts()
	if err != nil {
		return err
	}

	if len(contexts) < 1 {
		return errors.New("did not find any kubectl contexts configured")
	}

	_, err = l.runCommandHelm("env")
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
	out, err := l.runCommandKubectl("config", "get-contexts")
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

func (l *DataLayer) ListInstalled() (res []releaseElement, err error) {
	out, err := l.runCommandHelm("ls", "--all", "--all-namespaces", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (l *DataLayer) ChartHistory(namespace string, chartName string) (res []historyElement, err error) {
	// TODO: there is `max` but there is no `offset`
	out, err := l.runCommandHelm("history", chartName, "--namespace", namespace, "--max", "5", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}
