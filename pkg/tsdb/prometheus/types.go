package prometheus

import (
	"sync"
	"time"

	sdkhttpclient "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	apiv1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type DatasourceInfo struct {
	ID             int64
	HTTPClientOpts sdkhttpclient.Options
	URL            string
	HTTPMethod     string
	TimeInterval   string

	client apiv1.API
	cmtx   sync.RWMutex
}

func (s *DatasourceInfo) Client() apiv1.API {
	s.cmtx.RLock()
	defer s.cmtx.RUnlock()

	return s.client
}

func (s *DatasourceInfo) SetClient(client apiv1.API) {
	s.cmtx.Lock()
	defer s.cmtx.Unlock()

	s.client = client
}

type PrometheusQuery struct {
	Expr          string
	Step          time.Duration
	LegendFormat  string
	Start         time.Time
	End           time.Time
	RefId         string
	InstantQuery  bool
	RangeQuery    bool
	ExemplarQuery bool
	UtcOffsetSec  int64
}

type ExemplarEvent struct {
	Time   time.Time
	Value  float64
	Labels map[string]string
}

type QueryModel struct {
	Expr           string `json:"expr"`
	LegendFormat   string `json:"legendFormat"`
	Interval       string `json:"interval"`
	IntervalMS     int64  `json:"intervalMS"`
	StepMode       string `json:"stepMode"`
	RangeQuery     bool   `json:"range"`
	InstantQuery   bool   `json:"instant"`
	ExemplarQuery  bool   `json:"exemplar"`
	IntervalFactor int64  `json:"intervalFactor"`
	UtcOffsetSec   int64  `json:"utcOffsetSec"`
}

type PrometheusQueryType string

const (
	Range    PrometheusQueryType = "range"
	Instant  PrometheusQueryType = "instant"
	Exemplar PrometheusQueryType = "exemplar"
)
