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
const CacheKeyRepoVersions CacheKey = "repo-versions"
const CacheKeyRevManifests CacheKey = "rev-manifests"
const CacheKeyRevNotes CacheKey = "rev-notes"
const CacheKeyRevValues CacheKey = "rev-values"
const CacheKeyRepoChartValues CacheKey = "chart-values"

type Cache struct {
	Marshaler *marshaler.Marshaler
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

func (c *Cache) String(key CacheKey, tags store.Option, callback func() (string, error)) (string, error) {
	if tags == nil {
		tags = func(o *store.Options) {}
	}

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

	err = c.Marshaler.Set(ctx, key, out, tags)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (c *Cache) InvalidateByKey(key CacheKey) {
	log.Debugf("Invalidating key %s", key)
	err := c.Marshaler.Delete(context.Background(), key)
	if err != nil {
		log.Warnf("Failed to invalidate cache key %s: %s", key, err)
	}
}

func (c *Cache) InvalidateByTags(tags []string) {
	log.Debugf("Invalidating tags %v", tags)
	err := c.Marshaler.Invalidate(context.Background(), store.WithInvalidateTags(tags))
	if err != nil {
		log.Warnf("Failed to invalidate tags %v: %s", tags, err)
	}
}

func cacheTagRelease(namespace string, name string) string {
	return "release-" + namespace + "\v" + name
}
