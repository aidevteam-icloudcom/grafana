package thumbs

import (
	"context"
	"github.com/grafana/grafana/pkg/services/rendering"
	"time"

	"github.com/grafana/grafana/pkg/models"
)

type CrawlerMode string

const (

	// CrawlerModeThumbs will create small thumbnails for everything
	CrawlerModeThumbs CrawlerMode = "thumbs"

	// CrawlerModeAnalytics will get full page results for everythign
	CrawlerModeAnalytics CrawlerMode = "analytics"

	// CrawlerModeMigrate will migrate all dashboards with old schema
	CrawlerModeMigrate CrawlerMode = "migrate"
)

type crawlerState string

const (
	initializing crawlerState = "initializing"
	running      crawlerState = "running"
	stopping     crawlerState = "stopping"
	stopped      crawlerState = "stopped"
)

type previewRequest struct {
	OrgID int64                `json:"orgId"`
	UID   string               `json:"uid"`
	Kind  models.ThumbnailKind `json:"kind"`
	Theme models.Theme         `json:"theme"`
}

type crawlCmd struct {
	Mode  CrawlerMode  `json:"mode"`  // thumbs | analytics | migrate
	Theme models.Theme `json:"theme"` // light | dark
}

type crawlStatus struct {
	State    crawlerState `json:"state"`
	Started  time.Time    `json:"started,omitempty"`
	Finished time.Time    `json:"finished,omitempty"`
	Complete int          `json:"complete"`
	Errors   int          `json:"errors"`
	Queue    int          `json:"queue"`
	Last     time.Time    `json:"last,omitempty"`
}

type dashRenderer interface {

	// Assumes you have already authenticated as admin
	Start(ctx context.Context, authOpts rendering.AuthOpts, mode CrawlerMode, theme models.Theme, kind models.ThumbnailKind) error

	// Assumes you have already authenticated as admin
	Stop() (crawlStatus, error)

	// Assumes you have already authenticated as admin
	Status() (crawlStatus, error)

	IsRunning() bool
}

type thumbnailRepo interface {
	updateThumbnailState(state models.ThumbnailState, meta models.DashboardThumbnailMeta) error
	saveFromFile(filePath string, meta models.DashboardThumbnailMeta, dashboardVersion int) (int64, error)
	saveFromBytes(bytes []byte, mimeType string, meta models.DashboardThumbnailMeta, dashboardVersion int) (int64, error)
	getThumbnail(meta models.DashboardThumbnailMeta) (*models.DashboardThumbnail, error)
	findDashboardsWithStaleThumbnails(theme models.Theme, thumbnailKind models.ThumbnailKind) ([]*models.DashboardWithStaleThumbnail, error)
}
