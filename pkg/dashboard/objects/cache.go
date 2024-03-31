package objects

import (
	"context"
	"errors"
	"time"

	"github.com/eko/gocache/v3/marshaler"
	"github.com/eko/gocache/v3/store"
	gocache "github.com/patrickmn/go-cache"
	log "github.com/sirupsen/logrus"
)

type CacheKey = string

type Cache struct {
	Marshaler *marshaler.Marshaler `json:"-"`
	HitCount  int
	MissCount int
}

func NewCache() *Cache {
	gocacheClient := gocache.New(60*time.Minute, 10*time.Minute)
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
