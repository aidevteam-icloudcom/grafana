package caching

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/api/dtos"
)

const (
	XCacheHeader   = "X-Cache"
	StatusHit      = "HIT"
	StatusMiss     = "MISS"
	StatusNone     = "NONE"
	StatusBypass   = "BYPASS"
	StatusError    = "ERROR"
	StatusDisabled = "DISABLED"
)

type CacheQueryResponseFn func(context.Context, *backend.QueryDataResponse)
type CacheResourceResponseFn func(context.Context, *backend.CallResourceResponse)
type CacheStatus int

type CachedQueryDataResponse struct {
	// The cached data response associated with a query, or nil if no cached data is found
	Response *backend.QueryDataResponse
	// A function that should be used to cache a QueryDataResponse for a given query - can be set to nil by the method implementation
	UpdateCacheFn CacheQueryResponseFn
	Headers       map[string][]string
}

type CachedResourceDataResponse struct {
	// The cached resource response associated with a request, or nil if no cached data is found
	Response *backend.CallResourceResponse
	// A function that should be used to cache a CallResourceResponse for a given query - can be set to nil by the method implementation
	UpdateCacheFn CacheResourceResponseFn
}

func ProvideCachingService() *OSSCachingService {
	return &OSSCachingService{}
}

type CachingService interface {
	HandleQueryRequest(context.Context, bool, dtos.MetricRequest) CachedQueryDataResponse
	HandleResourceRequest(context.Context, *http.Request) CachedResourceDataResponse
}

// Implementation of interface
type OSSCachingService struct {
}

func (s *OSSCachingService) HandleQueryRequest(ctx context.Context, skipCache bool, req dtos.MetricRequest) CachedQueryDataResponse {
	return CachedQueryDataResponse{}
}

func (s *OSSCachingService) HandleResourceRequest(ctx context.Context, req *http.Request) CachedResourceDataResponse {
	return CachedResourceDataResponse{}
}

var _ CachingService = &OSSCachingService{}
