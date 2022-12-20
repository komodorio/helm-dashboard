package subproc

import (
	"fmt"
	"github.com/joomcode/errorx"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/apimachinery/pkg/apis/testapigroup/v1"
)

type Releases struct {
	HelmConfig HelmNSConfigGetter

	//list []*Release
}

func (a *Releases) List() ([]*Release, error) {
	hc, err := a.HelmConfig("")
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewList(hc)
	client.All = true
	client.AllNamespaces = true
	client.Limit = 0
	rels, err := client.Run()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}
	releases := []*Release{}
	for _, r := range rels {
		releases = append(releases, &Release{HelmConfig: a.HelmConfig, Orig: r})
	}
	return releases, nil
}

func (a *Releases) ByName(namespace string, name string) (*Release, error) {
	rels, err := a.List()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get list of releases")
	}

	for _, r := range rels {
		if r.Orig.Namespace == namespace && r.Orig.Name == name {
			return r, nil
		}
	}

	return nil, errorx.DataUnavailable.New(fmt.Sprintf("release '%s' is not found in namespace '%s'", name, namespace))
}

type Release struct {
	HelmConfig HelmNSConfigGetter
	Orig       *release.Release
	revisions  []*Release
}

func (r *Release) History() ([]*Release, error) {
	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewHistory(hc)
	revs, err := client.Run(r.Orig.Name)
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get revisions of release")
	}

	r.revisions = []*Release{}
	for _, rev := range revs {
		r.revisions = append(r.revisions, &Release{HelmConfig: r.HelmConfig, Orig: rev})
	}

	return r.revisions, nil
}

func (r *Release) Uninstall() error {
	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewUninstall(hc)
	_, err = client.Run(r.Orig.Name)
	if err != nil {
		return errorx.Decorate(err, "failed to uninstall release")
	}
	return nil
}

func (r *Release) Rollback(toRevision int) error {
	hc, err := r.HelmConfig(r.Orig.Namespace)
	if err != nil {
		return errorx.Decorate(err, "failed to get helm config for namespace '%s'", "")
	}

	client := action.NewRollback(hc)
	client.Version = toRevision
	return client.Run(r.Orig.Name)
}

func (r *Release) ParsedManifests() ([]*v1.Carp, error) {
	carps, err := ParseManifests(r.Orig.Manifest)
	if err != nil {
		return nil, err
	}

	for _, carp := range carps {
		if carp.Namespace == "" {
			carp.Namespace = r.Orig.Namespace
		}
	}

	return carps, err
}

func (r *Release) GetRev(revNo int) (*Release, error) {
	hist, err := r.History()
	if err != nil {
		return nil, errorx.Decorate(err, "failed to get history")
	}

	for _, rev := range hist {
		if rev.Orig.Version == revNo {
			return rev, nil
		}
	}

	return nil, errorx.InternalError.New("No revision found for number %s", revNo)
}
