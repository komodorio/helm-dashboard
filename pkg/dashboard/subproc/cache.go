package subproc

import (
	"context"
	"errors"
	"github.com/eko/gocache/v3/marshaler"
	"github.com/eko/gocache/v3/store"
	gocache "github.com/patrickmn/go-cache"
	log "github.com/sirupsen/logrus"
	"time"
)

type CacheKey = string

const CacheKeyRelList CacheKey = "installed-releases-list"
const CacheKeyShowChart CacheKey = "show-chart"
const CacheKeyRelHistory CacheKey = "release-history"
const CacheKeyRevManifests CacheKey = "rev-manifests"
const CacheKeyRevNotes CacheKey = "rev-notes"
const CacheKeyRevValues CacheKey = "rev-values"
const CacheKeyRepoChartValues CacheKey = "chart-values"
const CacheKeyAllRepos CacheKey = "all-repos"

type Cache struct {
	Marshaler *marshaler.Marshaler `json:"-"`
	HitCount  int
	MissCount int
}

func NewCache() *Cache {
	gocacheClient := gocache.New(5*time.Minute, 10*time.Minute)
	gocacheStore := store.NewGoCache(gocacheClient)

	// TODO: use tiered cache with some disk backend, allow configuring that static cache folder

	// Initializes marshaler
	marshal := marshaler.New(gocacheStore)
	return &Cache{
		Marshaler: marshal,
	}
}

func (c *Cache) String(key CacheKey, tags []string, callback func() (string, error)) (string, error) {
	if tags == nil {
		tags = make([]string, 0)
	}
	tags = append(tags, key)

	ctx := context.Background()
	out := ""
	_, err := c.Marshaler.Get(ctx, key, &out)
	if err == nil {
		log.Debugf("Using cached value for %s", key)
		c.HitCount++
		return out, nil
	} else if !errors.Is(err, store.NotFound{}) {
		return "", err
	}
	c.MissCount++

	out, err = callback()
	if err != nil {
		return "", err
	}

	err = c.Marshaler.Set(ctx, key, out, store.WithTags(tags))
	if err != nil {
		return "", err
	}
	return out, nil
}

func (c *Cache) Invalidate(tags ...CacheKey) {
	log.Debugf("Invalidating tags %v", tags)
	err := c.Marshaler.Invalidate(context.Background(), store.WithInvalidateTags(tags))
	if err != nil {
		log.Warnf("Failed to invalidate tags %v: %s", tags, err)
	}
}

func (c *Cache) Clear() error {
	c.HitCount = 0
	c.MissCount = 0
	return c.Marshaler.Clear(context.Background())
}

func cacheTagRelease(namespace string, name string) CacheKey {
	return "release" + "\v" + namespace + "\v" + name
}
func cacheTagRepoVers(chartName string) CacheKey {
	return "repo-versions" + "\v" + chartName
}

func cacheTagRepoCharts(name string) CacheKey {
	return "repo-charts" + "\v" + name
}

func cacheTagRepoName(name string) CacheKey {
	return "repo-name" + "\v" + name
}
