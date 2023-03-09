package objects

import (
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/Masterminds/semver/v3"
	"github.com/joomcode/errorx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/helmpath"
	"helm.sh/helm/v3/pkg/repo"
)

const AnnRepo = "helm-dashboard/repository-name"

type Repositories struct {
	Settings          *cli.EnvSettings
	HelmConfig        *action.Configuration
	mx                sync.Mutex
	versionConstraint *semver.Constraints
	LocalCharts       []string
}

func (r *Repositories) load() (*repo.File, error) {
	r.mx.Lock()
	defer r.mx.Unlock()

	// copied from cmd/helm/repo_list.go
	f, err := repo.LoadFile(r.Settings.RepositoryConfig)
	if err != nil && !isNotExist(err) {
		return nil, errorx.Decorate(err, "failed to load repository list")
	}
	return f, nil
}

func (r *Repositories) List() ([]Repository, error) {
	f, err := r.load()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to load repo information")
	}

	res := []Repository{}
	for _, item := range f.Repositories {
		res = append(res, &HelmRepo{
			Settings:          r.Settings,
			Orig:              item,
			versionConstraint: r.versionConstraint,
		})
	}

	if len(r.LocalCharts) > 0 {
		lc := LocalChart{
			LocalCharts: r.LocalCharts,
		}
		res = append(res, &lc)
	}

	return res, nil
}

func (r *Repositories) Add(name string, url string, username string, password string) error {
	if name == "" || url == "" {
		return errors.New("Name and URL are required parameters to add the repository")
	}

	if (username != "" && password == "") || (username == "" && password != "") {
		return errors.New("Username and Password, both are required parameters to add the repository with authentication")
	}

	// copied from cmd/helm/repo_add.go
	repoFile := r.Settings.RepositoryConfig

	// Ensure the file directory exists as it is required for file locking
	err := os.MkdirAll(filepath.Dir(repoFile), os.ModePerm)
	if err != nil && !os.IsExist(err) {
		return err
	}

	f, err := r.load()
	if err != nil {
		return errorx.Decorate(err, "Failed to load repo config")
	}

	r.mx.Lock()
	defer r.mx.Unlock()

	c := repo.Entry{
		Name:     name,
		URL:      url,
		Username: username,
		Password: password,
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

	rep, err := repo.NewChartRepository(&c, getter.All(r.Settings))
	if err != nil {
		return err
	}

	if _, err := rep.DownloadIndexFile(); err != nil {
		return errors.Wrapf(err, "looks like %q is not a valid chart repository or cannot be reached", url)
	}

	f.Update(&c)

	if err := f.WriteFile(repoFile, 0644); err != nil {
		return err
	}
	return nil
}

func (r *Repositories) Delete(name string) error {
	f, err := r.load()
	if err != nil {
		return errorx.Decorate(err, "failed to load repo information")
	}

	r.mx.Lock()
	defer r.mx.Unlock()

	// copied from cmd/helm/repo_remove.go
	if !f.Remove(name) {
		return errors.Errorf("no repo named %q found", name)
	}
	if err := f.WriteFile(r.Settings.RepositoryConfig, 0644); err != nil {
		return err
	}

	if err := removeRepoCache(r.Settings.RepositoryCache, name); err != nil {
		return err
	}
	return nil
}

func (r *Repositories) Get(name string) (Repository, error) {
	l, err := r.List()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of repos")
	}

	for _, entry := range l {
		if entry.Name() == name {
			return entry, nil
		}
	}

	return nil, errorx.DataUnavailable.New("Could not find repository '%s'", name)
}

// Containing returns list of chart versions for the given chart name, across all repositories
func (r *Repositories) Containing(name string) (repo.ChartVersions, error) {
	list, err := r.List()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of repos")
	}

	res := repo.ChartVersions{}
	for _, rep := range list {
		vers, err := rep.ByName(name)
		if err != nil {
			log.Warnf("Failed to get data from repo '%s', updating it might help", rep.Name())
			log.Debugf("The error was: %v", err)
			continue
		}

		var updatedChartVersions repo.ChartVersions
		for _, v := range vers {
			// just using annotations here to attach a bit of information to the object
			// it has nothing to do with k8s annotations and should not get into manifests
			if v.Annotations == nil {
				v.Annotations = map[string]string{}
			}

			v.Annotations[AnnRepo] = rep.Name()

			// Validate the versions against semantic version constraints and filter
			version, err := semver.NewVersion(v.Version)
			if err != nil {
				// Ignored if version string is not parsable
				log.Debugf("failed to parse version string %q: %v", v.Version, err)
				continue
			}

			if r.versionConstraint.Check(version) {
				// Add only versions that satisfy the semantic version constraint
				updatedChartVersions = append(updatedChartVersions, v)
			}
		}

		res = append(res, updatedChartVersions...)
	}
	return res, nil
}

func (r *Repositories) GetChartValues(chart string, ver string) (string, error) {
	// comes from cmd/helm/show.go
	client := action.NewShowWithConfig(action.ShowValues, r.HelmConfig)
	client.Version = ver

	cp, err := client.ChartPathOptions.LocateChart(chart, r.Settings)
	if err != nil {
		return "", err
	}

	out, err := client.Run(cp)
	if err != nil {
		return "", errorx.Decorate(err, "failed to get values for chart '%s'", chart)
	}
	return out, nil
}

type Repository interface {
	Name() string
	URL() string
	Update() error
	Charts() (repo.ChartVersions, error)
	ByName(name string) (repo.ChartVersions, error)
}

type HelmRepo struct {
	Settings *cli.EnvSettings
	Orig     *repo.Entry
	mx       sync.Mutex

	versionConstraint *semver.Constraints
}

func (r *HelmRepo) Name() string {
	return r.Orig.Name
}

func (r *HelmRepo) URL() string {
	return r.Orig.URL
}

func (r *HelmRepo) indexFileName() string {
	return filepath.Join(r.Settings.RepositoryCache, helmpath.CacheIndexFile(r.Orig.Name))
}

func (r *HelmRepo) getIndex() (*repo.IndexFile, error) {
	r.mx.Lock()
	defer r.mx.Unlock()

	f := r.indexFileName()
	ind, err := repo.LoadIndexFile(f)
	if err != nil {
		return nil, errorx.Decorate(err, "Repo index is corrupt or missing. Try updating repo")
	}

	ind.SortEntries()
	return ind, nil
}

func (r *HelmRepo) Charts() (repo.ChartVersions, error) {
	ind, err := r.getIndex()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get repo index")
	}

	res := repo.ChartVersions{}
	for _, cv := range ind.Entries {
		for _, v := range cv {
			version, err := semver.NewVersion(v.Version)
			if err != nil {
				// Ignored if version string is not parsable
				log.Debugf("failed to parse version string %q: %v", v.Version, err)
				continue
			}

			if r.versionConstraint.Check(version) {
				// Add only versions that satisfy the semantic version constraint
				res = append(res, v)

				// Only the highest version satisfying the constraint is required. Hence, break.
				// The constraint here is (only stable versions) vs (stable + dev/prerelease).
				// If dev versions are disabled and chart only has dev versions,
				// chart is excluded from the result.
				break
			}
		}
	}

	return res, nil
}

func (r *HelmRepo) ByName(name string) (repo.ChartVersions, error) {
	ind, err := r.getIndex()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get repo index")
	}

	nx, ok := ind.Entries[name]
	if ok {
		return nx, nil
	}
	return repo.ChartVersions{}, nil
}

func (r *HelmRepo) Update() error {
	r.mx.Lock()
	defer r.mx.Unlock()
	log.Infof("Updating repository: %s", r.Orig.Name)

	// from cmd/helm/repo_update.go

	// TODO: make this object to be an `Orig`?
	rep, err := repo.NewChartRepository(r.Orig, getter.All(r.Settings))
	if err != nil {
		return errorx.Decorate(err, "could not create repository object")
	}
	rep.CachePath = r.Settings.RepositoryCache

	_, err = rep.DownloadIndexFile()
	if err != nil {
		return errorx.Decorate(err, "failed to download repo index file")
	}
	return nil
}

// copied from cmd/helm/repo.go
func isNotExist(err error) bool {
	return os.IsNotExist(errors.Cause(err))
}

// copied from cmd/helm/repo_remove.go
func removeRepoCache(root, name string) error {
	idx := filepath.Join(root, helmpath.CacheChartsFile(name))
	if _, err := os.Stat(idx); err == nil {
		_ = os.Remove(idx)
	}

	idx = filepath.Join(root, helmpath.CacheIndexFile(name))
	if _, err := os.Stat(idx); os.IsNotExist(err) {
		return nil
	} else if err != nil {
		return errors.Wrapf(err, "can't remove index file %s", idx)
	}
	return os.Remove(idx)
}

// versionConstaint returns semantic version constraint instance that can be used to
// validate the version of repositories. The flag isDevelEnabled is used to configure
// enabling/disabling of development/prerelease versions of charts.
func versionConstaint(isDevelEnabled bool) (*semver.Constraints, error) {
	// When devel flag is disabled. i.e., Only stable releases are included.
	version := ">0.0.0"

	if isDevelEnabled {
		// When devel flag is enabled. i.e., Prereleases (alpha, beta, release candidate, etc.) are included.
		version = ">0.0.0-0"
	}

	constraint, err := semver.NewConstraint(version)
	if err != nil {
		return nil, errors.Wrapf(err, "invalid version constraint format %q", version)
	}

	return constraint, nil
}

type LocalChart struct {
	LocalCharts []string

	charts map[string]repo.ChartVersions
	mx     sync.Mutex
}

// Update reloads the chart information from disk
func (l *LocalChart) Update() error {
	l.mx.Lock()
	defer l.mx.Unlock()

	l.charts = map[string]repo.ChartVersions{}
	for _, lc := range l.LocalCharts {
		c, err := loader.Load(lc)
		if err != nil {
			log.Warnf("Failed to load chart from '%s': %s", lc, err)
			continue
		}

		// we don't filter out dev versions here, because local chart implies user wants to see the chart anyway
		l.charts[c.Name()] = repo.ChartVersions{&repo.ChartVersion{
			URLs:     []string{l.URL() + lc},
			Metadata: c.Metadata,
		}}
	}
	return nil
}

func (l *LocalChart) Name() string {
	return "[local]"
}

func (l *LocalChart) URL() string {
	return "file://"
}

func (l *LocalChart) Charts() (repo.ChartVersions, error) {
	_ = l.Update() // always re-read, for chart devs to have quick debug loop
	res := repo.ChartVersions{}
	for _, c := range l.charts {
		res = append(res, c...)
	}
	return res, nil
}

func (l *LocalChart) ByName(name string) (repo.ChartVersions, error) {
	_ = l.Update() // always re-read, for chart devs to have quick debug loop
	for n, c := range l.charts {
		if n == name {
			return c, nil
		}
	}
	return repo.ChartVersions{}, nil
}
