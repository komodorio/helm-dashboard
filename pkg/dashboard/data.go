package dashboard

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/Masterminds/semver/v3"
	"github.com/hexops/gotextdiff"
	"github.com/hexops/gotextdiff/myers"
	"github.com/hexops/gotextdiff/span"
	log "github.com/sirupsen/logrus"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"
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
	out, err := l.runCommandHelm("ls", "--all", "--all-namespaces", "--output", "json", "--time-format", time.RFC3339)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (l *DataLayer) ChartHistory(namespace string, chartName string) (res []*historyElement, err error) {
	// TODO: there is `max` but there is no `offset`
	out, err := l.runCommandHelm("history", chartName, "--namespace", namespace, "--max", "5", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	var aprev *semver.Version
	var cprev *semver.Version
	for _, elm := range res {
		chartRepoName, curVer, err := chartAndVersion(elm.Chart)
		if err != nil {
			return nil, err
		}
		elm.ChartName = chartRepoName
		elm.ChartVer = curVer
		elm.Action = ""
		elm.Updated.Time = elm.Updated.Time.Round(time.Second)

		cver, err1 := semver.NewVersion(elm.ChartVer)
		aver, err2 := semver.NewVersion(elm.AppVersion)
		if err1 == nil && err2 == nil {
			if aprev != nil && cprev != nil {
				switch {
				case aprev.LessThan(aver):
					elm.Action = "app_upgrade"
				case aprev.GreaterThan(aver):
					elm.Action = "app_downgrade"
				case cprev.LessThan(cver):
					elm.Action = "chart_upgrade"
				case cprev.GreaterThan(cver):
					elm.Action = "chart_downgrade"
				default:
					elm.Action = "reconfigure"
				}
			}
		} else {
			log.Debugf("Semver parsing errors: %s=%s, %s=%s", elm.ChartVer, err1, elm.AppVersion, err2)
		}

		aprev = aver
		cprev = cver
	}

	return res, nil
}

func (l *DataLayer) ChartRepoVersions(chartName string) (res []repoChartElement, err error) {
	out, err := l.runCommandHelm("search", "repo", "--regexp", "/"+chartName+"\v", "--versions", "--output", "json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (l *DataLayer) RevisionManifests(namespace string, chartName string, revision int) (res string, err error) {
	out, err := l.runCommandHelm("get", "manifest", chartName, "--namespace", namespace, "--revision", strconv.Itoa(revision))
	if err != nil {
		return "", err
	}
	return out, nil
}

func (l *DataLayer) RevisionManifestsDiff(namespace string, name string, revision1 int, revision2 int) (string, error) {
	manifest1, err := l.RevisionManifests(namespace, name, revision1)
	if err != nil {
		return "", nil
	}

	manifest2, err := l.RevisionManifests(namespace, name, revision2)
	if err != nil {
		return "", nil
	}

	edits := myers.ComputeEdits(span.URIFromPath(""), manifest1, manifest2)
	unified := gotextdiff.ToUnified("a.txt", "b.txt", manifest1, edits)
	diff := fmt.Sprint(unified)
	return diff, nil
}
