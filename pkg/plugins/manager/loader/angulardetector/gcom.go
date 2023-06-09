package angulardetector

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"

	"github.com/grafana/grafana/pkg/plugins/log"
)

const defaultGCOMDetectorsGetterTTL = time.Hour * 24

var _ detectorsGetter = &gcomDetectorsGetter{}

// gcomDetectorsGetter is a detectorsGetter which fetches patterns from GCOM, and caches the result for
// the specified ttl. All subsequent calls to getDetectors will return the cached result until the TTL expires.
// This struct is safe for concurrent use.
type gcomDetectorsGetter struct {
	log log.Logger

	httpClient *http.Client

	baseURL string

	ttl        time.Duration
	lastUpdate time.Time

	mux       sync.Mutex
	detectors []detector
}

// newGCOMDetectorsGetter returns a new gcomDetectorsGetter.
// baseURL is the GCOM base url, without /api and without a trailing slash (e.g.: https://grafana.com)
// A default reasonable value for ttl is defaultGCOMDetectorsGetterTTL.
func newGCOMDetectorsGetter(baseURL string, ttl time.Duration) (detectorsGetter, error) {
	cl, err := httpclient.New()
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}
	return &gcomDetectorsGetter{
		log:        log.New("plugins.angulardetector.gcom"),
		baseURL:    baseURL,
		httpClient: cl,
		ttl:        ttl,
	}, nil
}

// tryUpdateRemoteDetectors tries to update the cached detectors value, if the cache has expired.
// If the TTL hasn't passed yet, this function returns immediately.
// Otherwise, it calls fetch on the fetcher, and updates the cached detectors value and lastUpdate.
// The caller must have acquired f.mux.
func (g *gcomDetectorsGetter) tryUpdateRemoteDetectors(ctx context.Context) error {
	if time.Since(g.lastUpdate) <= g.ttl {
		// Patterns already fetched
		return nil
	}

	// Update last update even if there's an error, to avoid wasting time due to consecutive failures
	defer func() {
		g.lastUpdate = time.Now()
	}()

	// fetch patterns using fetcher
	resp, err := g.fetch(ctx)
	if err != nil {
		return fmt.Errorf("fetch: %w", err)
	}

	// Convert patterns definitions to detectors
	detectors, err := resp.detectors()
	if err != nil {
		return fmt.Errorf("detectors: %w", err)
	}

	// Update cached result
	g.detectors = detectors
	return nil
}

// getDetectors gets the remote detections, either from the cache or from the remote source (if TTL has passed).
// If an error occurs during the cache refresh, the function fails silently and the old cached value is returned
// instead.
func (g *gcomDetectorsGetter) getDetectors(ctx context.Context) []detector {
	g.mux.Lock()
	defer g.mux.Unlock()

	if err := g.tryUpdateRemoteDetectors(ctx); err != nil {
		// Fail silently
		g.log.Warn("Could not update remote detectors", "error", err)
	}
	return g.detectors
}

// fetch fetches the angular patterns from GCOM and returns them as gcomPatterns.
// Call detectors() on the returned value to get the corresponding detectors.
func (g *gcomDetectorsGetter) fetch(ctx context.Context) (gcomPatterns, error) {
	st := time.Now()

	reqURL, err := url.JoinPath(g.baseURL, "/api/angular_patterns")
	if err != nil {
		return nil, fmt.Errorf("url joinpath: %w", err)
	}

	g.log.Debug("Fetching remote angular detection patterns", "url", reqURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("new request with context: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http do: %w", err)
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			g.log.Error("response body close error", "error", err)
		}
	}()
	var out gcomPatterns
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("json decode: %w", err)
	}
	g.log.Debug("fetched remote angular detection patterns", "duration", time.Since(st))
	return out, nil
}

type gcomPatternType string

const (
	gcomPatternTypeContains gcomPatternType = "contains"
	gcomPatternTypeRegex    gcomPatternType = "regex"
)

// gcomPattern is an Angular detection pattern returned by the GCOM API.
type gcomPattern struct {
	Name  string
	Value string
	Type  gcomPatternType
}

// detector converts a gcomPattern into a detector, based on its Type.
func (p *gcomPattern) detector() (detector, error) {
	switch p.Type {
	case gcomPatternTypeContains:
		return &containsBytesDetector{pattern: []byte(p.Value)}, nil
	case gcomPatternTypeRegex:
		re, err := regexp.Compile(p.Value)
		if err != nil {
			return nil, fmt.Errorf("%q regexp compile: %w", p.Value, err)
		}
		return &regexDetector{regex: re}, nil
	}
	return nil, errors.New("unknown pattern type")
}

// gcomPatterns is a slice of gcomPattern s.
type gcomPatterns []gcomPattern

// detectors converts the slice of gcomPattern s into a slice of detectors, by calling detector() on each gcomPattern.
func (p gcomPatterns) detectors() ([]detector, error) {
	var finalErr error
	detectors := make([]detector, 0, len(p))
	for _, pattern := range p {
		d, err := pattern.detector()
		if err != nil {
			finalErr = errors.Join(finalErr, err)
			continue
		}
		detectors = append(detectors, d)
	}
	if finalErr != nil {
		return nil, finalErr
	}
	return detectors, nil
}
