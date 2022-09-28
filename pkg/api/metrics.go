package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

func (hs *HTTPServer) handleQueryMetricsError(err error) *response.NormalResponse {
	if errors.Is(err, datasources.ErrDataSourceAccessDenied) {
		return response.Error(http.StatusForbidden, "Access denied to data source", err)
	}
	if errors.Is(err, datasources.ErrDataSourceNotFound) {
		return response.Error(http.StatusNotFound, "Data source not found", err)
	}

	var secretsPlugin datasources.ErrDatasourceSecretsPluginUserFriendly
	if errors.As(err, &secretsPlugin) {
		return response.Error(http.StatusInternalServerError, fmt.Sprint("Secrets Plugin error: ", err.Error()), err)
	}

	return response.ErrOrFallback(http.StatusInternalServerError, "Query data error", err)
}

// QueryMetricsV2 returns query metrics.
// swagger:route POST /ds/query ds queryMetricsWithExpressions
//
// DataSource query metrics with expressions.
//
// If you are running Grafana Enterprise and have Fine-grained access control enabled
// you need to have a permission with action: `datasources:query`.
//
// Responses:
// 200: queryMetricsWithExpressionsRespons
// 207: queryMetricsWithExpressionsRespons
// 401: unauthorisedError
// 400: badRequestError
// 403: forbiddenError
// 500: internalServerError
func (hs *HTTPServer) QueryMetricsV2(c *models.ReqContext) response.Response {
	reqDTO := dtos.MetricRequest{}
	if err := web.Bind(c.Req, &reqDTO); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	reqDTO.HTTPRequest = c.Req

	resp, err := hs.queryDataService.QueryData(c.Req.Context(), c.SignedInUser, c.SkipCache, reqDTO, true)
	if err != nil {
		return hs.handleQueryMetricsError(err)
	}
	return hs.toJsonStreamingResponse(resp)
}

func (hs *HTTPServer) toJsonStreamingResponse(qdr *backend.QueryDataResponse) response.Response {
	if !hs.Features.IsEnabled(featuremgmt.FlagDatasourceQueryMultiStatus) {
		statusCode := http.StatusOK
		for _, res := range qdr.Responses {
			if res.Error != nil {
				statusCode = http.StatusBadRequest
			}
		}
		return response.JSONStreaming(statusCode, qdr)
	}

	statusCode := http.StatusOK
	res := map[string]queryResponse{}
	for refID, resp := range qdr.Responses {
		qr := queryResponse{Frames: resp.Frames, Error: resp.Error, Status: http.StatusOK}
		if resp.Error != nil {
			statusCode = http.StatusMultiStatus

			var ed backend.ErrorDetails
			if errors.As(resp.Error, &ed) {
				qr.Status = ed.Status.HTTPStatus()
			} else {
				qr.Status = backend.InferErrorStatusFromError(resp.Error).HTTPStatus()
			}
		}
		res[refID] = qr
	}
	return response.JSONStreaming(statusCode, &metricsResponse{Results: res})
}

// swagger:parameters queryMetricsWithExpressions
type QueryMetricsWithExpressionsBodyParams struct {
	// in:body
	// required:true
	Body dtos.MetricRequest `json:"body"`
}

// swagger:response queryMetricsWithExpressionsRespons
type QueryMetricsWithExpressionsRespons struct {
	// The response message
	// in: body
	Body *backend.QueryDataResponse `json:"body"`
}
