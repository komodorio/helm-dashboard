package subproc

import (
	"bytes"
	"encoding/json"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/chart"
	"strings"
)

func (d *DataLayer) ChartRepoList() (res []RepositoryElement, err error) {
	out, err := d.Cache.String(CacheKeyAllRepos, nil, func() (string, error) {
		// TODO: do a bg check, if the state is changed - do reset some caches
		return d.runCommandHelm("repo", "list", "--output", "json")
	})
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartRepoAdd(name string, url string) (string, error) {
	d.Cache.Invalidate(CacheKeyAllRepos)
	out, err := d.runCommandHelm("repo", "add", "--force-update", name, url)
	if err != nil {
		return "", err
	}

	return out, nil
}

func (d *DataLayer) ChartRepoDelete(name string) (string, error) {
	d.Cache.Invalidate(CacheKeyAllRepos)
	out, err := d.runCommandHelm("repo", "remove", name)
	if err != nil {
		return "", err
	}

	return out, nil
}

func (d *DataLayer) ChartRepoUpdate(name string) error {
	d.Cache.Invalidate(cacheTagRepoName(name), CacheKeyAllRepos)

	cmd := []string{"repo", "update"}
	if name != "" {
		cmd = append(cmd, name)
	}

	_, err := d.runCommandHelm(cmd...)
	return err
}

func (d *DataLayer) ChartRepoVersions(chartName string) (res []*RepoChartElement, err error) {
	search := "/" + chartName + "\v"
	if strings.Contains(chartName, "/") {
		search = "\v" + chartName + "\v"
	}

	cmd := []string{"search", "repo", "--regexp", search, "--versions", "--output", "json"}
	out, err := d.Cache.String(cacheTagRepoVers(chartName), []string{CacheKeyAllRepos}, func() (string, error) {
		return d.runCommandHelm(cmd...)
	})
	if err != nil {
		if strings.Contains(err.Error(), "no repositories configured") {
			out = "[]"
		} else {
			return nil, err
		}
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataLayer) ChartRepoCharts(repoName string) (res []*RepoChartElement, err error) {
	cmd := []string{"search", "repo", "--regexp", "\v" + repoName + "/", "--output", "json"}
	out, err := d.Cache.String(cacheTagRepoCharts(repoName), []string{CacheKeyAllRepos}, func() (string, error) {
		return d.runCommandHelm(cmd...)
	})
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(out), &res)
	if err != nil {
		return nil, err
	}

	app, err := d.AppForCtx(d.KubeContext)
	if err != nil {
		return nil, err
	}

	ins, err := app.Releases.List()
	if err != nil {
		return nil, err
	}

	enrichRepoChartsWithInstalled(res, ins)

	return res, nil
}

func enrichRepoChartsWithInstalled(charts []*RepoChartElement, installed []*Release) {
	for _, rchart := range charts {
		for _, rel := range installed {
			pieces := strings.Split(rchart.Name, "/")
			if pieces[1] == rel.Orig.Chart.Name() {
				// TODO: there can be more than one
				rchart.InstalledNamespace = rel.Orig.Namespace
				rchart.InstalledName = rel.Orig.Name
			}
		}
	}
}

// ShowValues get values from repo chart, not from installed release
func (d *DataLayer) ShowValues(chart string, ver string) (string, error) {
	return d.Cache.String(CacheKeyRepoChartValues+"\v"+chart+"\v"+ver, nil, func() (string, error) {
		return d.runCommandHelm("show", "values", chart, "--version", ver)
	})
}

func (d *DataLayer) ShowChart(chartName string) ([]*chart.Metadata, error) { // TODO: add version parameter to method
	out, err := d.Cache.String(CacheKeyShowChart+"\v"+chartName, []string{"chart\v" + chartName}, func() (string, error) {
		return d.runCommandHelm("show", "chart", chartName)
	})

	if err != nil {
		return nil, err
	}

	deccoder := yaml.NewDecoder(bytes.NewReader([]byte(out)))
	res := make([]*chart.Metadata, 0)
	var tmp interface{}

	for deccoder.Decode(&tmp) == nil {
		jsoned, err := json.Marshal(tmp)
		if err != nil {
			return nil, err
		}

		var resjson chart.Metadata
		err = json.Unmarshal(jsoned, &resjson)
		if err != nil {
			return nil, err
		}
		res = append(res, &resjson)
	}

	return res, nil
}

type Repositories struct {
	HelmConfig HelmNSConfigGetter
}
