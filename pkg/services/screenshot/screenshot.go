package screenshot

import (
	"context"
	"errors"
	"fmt"
	"time"

	gocache "github.com/patrickmn/go-cache"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"golang.org/x/sync/singleflight"

	"github.com/grafana/grafana/pkg/components/imguploader"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/rendering"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

const (
	namespace = "grafana"
	subsystem = "screenshot"
)

var (
	DefaultTheme   = models.ThemeDark
	DefaultTimeout = 15 * time.Second
	DefaultHeight  = 500
	DefaultWidth   = 1000
)

var (
	ErrScreenshotsUnavailable = errors.New("screenshots unavailable")
)

// Screenshot represents a screenshot of a dashboard in Grafana.
//
// A screenshot can have an ImageOnDiskPath and an ImagePublicURL if the
// screenshot is stored or disk and uploaded to a cloud storage service or
// made accessible via the Grafana HTTP server.
type Screenshot struct {
	ImageOnDiskPath string
	ImagePublicURL  string
}

// ScreenshotOptions are the options for taking a screenshot.
type ScreenshotOptions struct {
	DashboardUID string
	PanelID      int64
	Width        int
	Height       int
	Theme        models.Theme
	Timeout      time.Duration
}

// SetDefaults sets default values for missing or invalid options.
func (s ScreenshotOptions) SetDefaults() ScreenshotOptions {
	if s.Width <= 0 {
		s.Width = DefaultWidth
	}
	if s.Height <= 0 {
		s.Height = DefaultHeight
	}
	switch s.Theme {
	case models.ThemeDark, models.ThemeLight:
	default:
		s.Theme = DefaultTheme
	}
	if s.Timeout <= 0 {
		s.Timeout = DefaultTimeout
	}
	return s
}

// ScreenshotService is an interface for taking screenshots.
//go:generate mockgen -destination=mock.go -package=screenshot github.com/grafana/grafana/pkg/services/screenshot ScreenshotService
type ScreenshotService interface {
	Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error)
}

// BrowserScreenshotService takes screenshots using a headless browser.
type BrowserScreenshotService struct {
	db                  sqlstore.Store
	rs                  rendering.Service
	screenshotDuration  prometheus.Histogram
	screenshotFailures  prometheus.Counter
	screenshotSuccesses prometheus.Counter
}

func NewBrowserScreenshotService(r prometheus.Registerer, db sqlstore.Store, rs rendering.Service) ScreenshotService {
	return &BrowserScreenshotService{
		db: db,
		rs: rs,
		screenshotDuration: promauto.With(r).NewHistogram(prometheus.HistogramOpts{
			Name:      "browser_screenshot_duration_seconds",
			Buckets:   []float64{0.1, 0.25, 0.5, 1, 2, 5, 10, 15},
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		screenshotFailures: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "browser_screenshot_failures_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		screenshotSuccesses: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "browser_screenshot_successes_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
	}
}

// Take returns a screenshot with an ImageOnDiskPath or an error if the
// dashboard does not exist or it failed to screenshot the dashboard.
// It uses both the context and the timeout in ScreenshotOptions, however
// the timeout in ScreenshotOptions is sent to the remote browser where it
// is used as a client timeout.
func (s *BrowserScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	q := models.GetDashboardsQuery{DashboardUIds: []string{opts.DashboardUID}}
	if err := s.db.GetDashboards(ctx, &q); err != nil {
		defer s.screenshotFailures.Inc()
		return nil, err
	}
	if len(q.Result) == 0 {
		return nil, models.ErrDashboardNotFound
	}
	dashboard := q.Result[0]

	start := time.Now()
	defer func() { s.screenshotDuration.Observe(time.Since(start).Seconds()) }()

	opts = opts.SetDefaults()
	renderOpts := rendering.Opts{
		AuthOpts: rendering.AuthOpts{
			OrgID:   dashboard.OrgId,
			OrgRole: models.ROLE_ADMIN,
		},
		ErrorOpts: rendering.ErrorOpts{
			ErrorConcurrentLimitReached: true,
			ErrorRenderUnavailable:      true,
		},
		TimeoutOpts: rendering.TimeoutOpts{
			Timeout: opts.Timeout,
		},
		Width:           opts.Width,
		Height:          opts.Height,
		Theme:           opts.Theme,
		ConcurrentLimit: setting.AlertingRenderLimit,
		Path:            fmt.Sprintf("d-solo/%s/%s/?orgId=%d&panelId=%d", dashboard.Uid, dashboard.Slug, dashboard.OrgId, opts.PanelID),
	}

	result, err := s.rs.Render(ctx, renderOpts, nil)
	if err != nil {
		defer s.screenshotFailures.Inc()
		return nil, fmt.Errorf("failed to take screenshot: %w", err)
	}

	defer s.screenshotSuccesses.Inc()
	screenshot := Screenshot{ImageOnDiskPath: result.FilePath}
	return &screenshot, nil
}

// CachableScreenshotService caches screenshots.
type CachableScreenshotService struct {
	cache       *gocache.Cache
	service     ScreenshotService
	cacheHits   prometheus.Counter
	cacheMisses prometheus.Counter
}

func NewCachableScreenshotService(r prometheus.Registerer, expiration time.Duration, service ScreenshotService) ScreenshotService {
	return &CachableScreenshotService{
		cache:   gocache.New(expiration, time.Minute),
		service: service,
		cacheHits: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "cache_hits_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		cacheMisses: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "cache_misses_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
	}
}

// Take returns the screenshot from the cache or asks the service to take a
// new screenshot and cache it before returning it.
func (s *CachableScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	k := fmt.Sprintf("%s-%d-%s", opts.DashboardUID, opts.PanelID, opts.Theme)

	if v, ok := s.cache.Get(k); ok {
		defer s.cacheHits.Inc()
		return v.(*Screenshot), nil
	}

	defer s.cacheMisses.Inc()
	screenshot, err := s.service.Take(ctx, opts)
	if err != nil {
		return nil, err
	}

	s.cache.Set(k, screenshot, 0)

	return screenshot, nil
}

// NoopScreenshotService is a service that takes no-op screenshots.
type NoopScreenshotService struct{}

func (s *NoopScreenshotService) Take(_ context.Context, _ ScreenshotOptions) (*Screenshot, error) {
	return &Screenshot{}, nil
}

// ObservableScreenshotService is a service that records metrics about screenshots.
type ObservableScreenshotService struct {
	service   ScreenshotService
	duration  prometheus.Histogram
	failures  prometheus.Counter
	successes prometheus.Counter
}

func NewObservableScreenshotService(r prometheus.Registerer, service ScreenshotService) ScreenshotService {
	return &ObservableScreenshotService{
		service: service,
		duration: promauto.With(r).NewHistogram(prometheus.HistogramOpts{
			Name:      "duration_seconds",
			Buckets:   []float64{0.1, 0.25, 0.5, 1, 2, 5, 10, 15},
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		failures: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "failures_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		successes: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "successes_total",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
	}
}

func (s *ObservableScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	start := time.Now()
	defer func() { s.duration.Observe(time.Since(start).Seconds()) }()

	screenshot, err := s.service.Take(ctx, opts)
	if err != nil {
		defer s.failures.Inc()
	} else {
		defer s.successes.Inc()
	}
	return screenshot, err
}

type ScreenshotsUnavailableService struct{}

func (s *ScreenshotsUnavailableService) Take(_ context.Context, _ ScreenshotOptions) (*Screenshot, error) {
	return nil, ErrScreenshotsUnavailable
}

// SingleFlightScreenshotService prevents duplicate screenshots.
type SingleFlightScreenshotService struct {
	f       singleflight.Group
	service ScreenshotService
}

func NewSingleFlightScreenshotService(service ScreenshotService) ScreenshotService {
	return &SingleFlightScreenshotService{service: service}
}

// Take returns a screenshot or an error. It ensures that at most one screenshot
// can be taken at a time for the same dashboard and theme. Duplicate screenshots
// wait for the first screenshot to complete and receive the same screenshot.
func (s *SingleFlightScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	k := fmt.Sprintf("%s-%d-%s", opts.DashboardUID, opts.PanelID, opts.Theme)

	v, err, _ := s.f.Do(k, func() (interface{}, error) {
		return s.service.Take(ctx, opts)
	})
	if err != nil {
		return nil, err
	}

	screenshot := v.(*Screenshot)
	return screenshot, err
}

// RateLimitScreenshotService ensures that at most N screenshots can be taken
// at a time.
type RateLimitScreenshotService struct {
	service ScreenshotService
	tokens  chan struct{}
}

func NewRateLimitScreenshotService(service ScreenshotService, n int64) ScreenshotService {
	return &RateLimitScreenshotService{
		service: service,
		tokens:  make(chan struct{}, n),
	}
}

// Take returns a screenshot or an error. It ensures that at most N screenshots
// can be taken at a time. The service has N tokens such that a token is consumed
// at the start of a screenshot and returned when the screenshot has either
// succeeded or failed. A screenshot can timeout if the context is canceled
// while waiting for a token or while the screenshot is being taken.
func (s *RateLimitScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	select {
	// the context is canceled
	case <-ctx.Done():
		return nil, ctx.Err()
	// there is a token available
	case s.tokens <- struct{}{}:
	}
	// acquired token must be returned
	defer func() {
		<-s.tokens
	}()
	return s.service.Take(ctx, opts)
}

// UploadingScreenshotService uploads taken screenshots.
type UploadingScreenshotService struct {
	service         ScreenshotService
	uploader        imguploader.ImageUploader
	uploadFailures  prometheus.Counter
	uploadSuccesses prometheus.Counter
}

func NewUploadingScreenshotService(r prometheus.Registerer, service ScreenshotService, uploader imguploader.ImageUploader) ScreenshotService {
	return &UploadingScreenshotService{
		service:  service,
		uploader: uploader,
		uploadFailures: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "upload_failures",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
		uploadSuccesses: promauto.With(r).NewCounter(prometheus.CounterOpts{
			Name:      "upload_successes",
			Namespace: namespace,
			Subsystem: subsystem,
		}),
	}
}

// Take uploads a screenshot with an ImageOnDiskPath and returns a new
// screenshot with the unmodified ImageOnDiskPath and a ImagePublicURL.
// It returns the unmodified screenshot on error.
func (s *UploadingScreenshotService) Take(ctx context.Context, opts ScreenshotOptions) (*Screenshot, error) {
	screenshot, err := s.service.Take(ctx, opts)
	if err != nil {
		return nil, err
	}

	url, err := s.uploader.Upload(ctx, screenshot.ImageOnDiskPath)
	if err != nil {
		defer s.uploadFailures.Inc()
		return screenshot, fmt.Errorf("failed to upload screenshot: %w", err)
	}
	screenshot.ImagePublicURL = url

	defer s.uploadSuccesses.Inc()
	return screenshot, nil
}

func provideService(cfg *setting.Cfg, r prometheus.Registerer, db *sqlstore.SQLStore, rs rendering.Service) (ScreenshotService, error) {
	u, err := imguploader.NewImageUploader()
	if err != nil {
		return nil, err
	}

	var s ScreenshotService
	s = NewBrowserScreenshotService(r, db, rs)
	s = NewUploadingScreenshotService(r, s, u)
	s = NewRateLimitScreenshotService(s, 5)
	s = NewSingleFlightScreenshotService(s)
	s = NewCachableScreenshotService(r, 15*time.Second, s)
	s = NewObservableScreenshotService(r, s)
	return s, nil
}

func ProvideService(cfg *setting.Cfg, db *sqlstore.SQLStore, rs rendering.Service) (ScreenshotService, error) {
	return provideService(cfg, prometheus.DefaultRegisterer, db, rs)
}

func ProvideServiceForTest(cfg *setting.Cfg, db *sqlstore.SQLStore, rs rendering.Service) (ScreenshotService, error) {
	return provideService(cfg, prometheus.NewRegistry(), db, rs)
}
