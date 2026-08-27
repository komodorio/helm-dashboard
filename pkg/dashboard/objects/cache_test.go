package objects

import (
	"sync"
	"testing"
)

func TestCache_String_HitsAndMisses(t *testing.T) {
	c := NewCache()

	calls := 0
	fn := func() (string, error) {
		calls++
		return "hello-value", nil
	}

	// First call -> Miss
	val, err := c.String("my-key", nil, fn)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if val != "hello-value" {
		t.Errorf("expected 'hello-value', got %q", val)
	}
	if calls != 1 {
		t.Errorf("expected 1 callback call, got %d", calls)
	}
	if c.GetMissCount() != 1 || c.GetHitCount() != 0 {
		t.Errorf("expected 1 miss, 0 hits; got misses=%d, hits=%d", c.GetMissCount(), c.GetHitCount())
	}

	// Second call -> Hit
	val, err = c.String("my-key", nil, fn)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if val != "hello-value" {
		t.Errorf("expected 'hello-value', got %q", val)
	}
	if calls != 1 {
		t.Errorf("callback should not have been called on cache hit, calls=%d", calls)
	}
	if c.GetMissCount() != 1 || c.GetHitCount() != 1 {
		t.Errorf("expected 1 miss, 1 hit; got misses=%d, hits=%d", c.GetMissCount(), c.GetHitCount())
	}

	// Invalidate key
	c.Invalidate("my-key")

	// Third call -> Miss after invalidation
	val, err = c.String("my-key", nil, fn)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calls != 2 {
		t.Errorf("callback should have been called after invalidation, calls=%d", calls)
	}

	// Clear cache
	if err := c.Clear(); err != nil {
		t.Fatalf("Clear() failed: %v", err)
	}
	if c.GetHitCount() != 0 || c.GetMissCount() != 0 {
		t.Errorf("expected counts reset to 0 after Clear()")
	}
}

func TestCache_Concurrent(t *testing.T) {
	c := NewCache()

	var wg sync.WaitGroup
	workers := 10
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for j := 0; j < 20; j++ {
				_, _ = c.String("concurrent-key", nil, func() (string, error) {
					return "concurrent-val", nil
				})
			}
		}(i)
	}

	wg.Wait()

	if c.GetHitCount()+c.GetMissCount() != int64(workers*20) {
		t.Errorf("expected total requests to equal hits+misses, got total=%d", c.GetHitCount()+c.GetMissCount())
	}
}
