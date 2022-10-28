package routes

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/tsdb/cloudwatch/models"
	"github.com/grafana/grafana/pkg/tsdb/cloudwatch/models/resources"
	"github.com/grafana/grafana/pkg/tsdb/cloudwatch/services"
)

func MetricsHandler(pluginCtx backend.PluginContext, reqCtxFactory models.RequestContextFactoryFunc, parameters url.Values) ([]byte, *models.HttpError) {
	metricsRequest, err := resources.GetMetricsRequest(parameters)
	if err != nil {
		return nil, models.NewHttpError("error in MetricsHandler", http.StatusBadRequest, err)
	}

	service, err := newListMetricsService(pluginCtx, reqCtxFactory, metricsRequest.Region)
	if err != nil {
		return nil, models.NewHttpError("error in MetricsHandler", http.StatusInternalServerError, err)
	}

	var response []models.ResourceResponse[models.Metric]
	switch metricsRequest.Type() {
	case resources.AllMetricsRequestType:
		response = services.GetAllHardCodedMetrics()
	case resources.MetricsByNamespaceRequestType:
		response, err = services.GetHardCodedMetricsByNamespace(metricsRequest.Namespace)
	case resources.CustomNamespaceRequestType:
		response, err = service.GetMetricsByNamespace(metricsRequest.Namespace)
	}
	if err != nil {
		return nil, models.NewHttpError("error in MetricsHandler", http.StatusInternalServerError, err)
	}

	metricsResponse, err := json.Marshal(response)
	if err != nil {
		return nil, models.NewHttpError("error in MetricsHandler", http.StatusInternalServerError, err)
	}

	return metricsResponse, nil
}
