package subproc

import (
	"bytes"
	"encoding/json"
	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/repo"
	"os"
	"path/filepath"
	"strings"
)

func (d *DataLayer) ChartRepoUpdate(name string) error {
	d.Cache.Invalidate(cacheTagRepoName(name), CacheKeyAllRepos, cacheTagRepoCharts(name))

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
	Settings *cli.EnvSettings
}

func (r *Repositories) Load() (*repo.File, error) {
	// copied from cmd/helm/repo_list.go
	f, err := repo.LoadFile(r.Settings.RepositoryConfig)
	if err != nil && !isNotExist(err) {
		return nil, errorx.Decorate(err, "failed to load repository list")
	}
	return f, nil
}

func (r *Repositories) List() ([]*repo.Entry, error) {
	f, err := r.Load()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to load repo information")
	}
	return f.Repositories, nil
}

func (rr *Repositories) Add(name string, url string) error {
	// copied from cmd/helm/repo_add.go
	repoFile := rr.Settings.RepositoryConfig

	// Ensure the file directory exists as it is required for file locking
	err := os.MkdirAll(filepath.Dir(repoFile), os.ModePerm)
	if err != nil && !os.IsExist(err) {
		return err
	}

	f, err := rr.Load()
	if err != nil {
		return errorx.Decorate(err, "Failed to load repo config")
	}

	c := repo.Entry{
		Name: name,
		URL:  url,
		//Username:              o.username,
		//Password:              o.password,
		//PassCredentialsAll:    o.passCredentialsAll,
		//CertFile:              o.certFile,
		//KeyFile:               o.keyFile,
		//CAFile:                o.caFile,
		//InsecureSkipTLSverify: o.insecureSkipTLSverify,
	}

	// Check if the repo name is legal
	if strings.Contains(c.Name, "/") {
		return errors.Errorf("repository name (%s) contains '/', please specify a different name without '/'", c.Name)
	}

	r, err := repo.NewChartRepository(&c, getter.All(rr.Settings))
	if err != nil {
		return err
	}

	if _, err := r.DownloadIndexFile(); err != nil {
		return errors.Wrapf(err, "looks like %q is not a valid chart repository or cannot be reached", url)
	}

	f.Update(&c)

	if err := f.WriteFile(repoFile, 0644); err != nil {
		return err
	}
	return nil
}

func (r *Repositories) Delete(name string) error {
	return errorx.NotImplemented.New("") // TODO
}

// copied from cmd/helm/repo.go
func isNotExist(err error) bool {
	return os.IsNotExist(errors.Cause(err))
}
