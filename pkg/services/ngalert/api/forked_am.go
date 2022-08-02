package api

import (
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/datasources"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
)

type ForkedAlertmanagerApi struct {
	AMSvc           *LotexAM
	GrafanaSvc      *AlertmanagerSrv
	DatasourceCache datasources.CacheService
}

// NewForkedAM implements a set of routes that proxy to various Alertmanager-compatible backends.
func NewForkedAM(datasourceCache datasources.CacheService, proxy *LotexAM, grafana *AlertmanagerSrv) *ForkedAlertmanagerApi {
	return &ForkedAlertmanagerApi{
		AMSvc:           proxy,
		GrafanaSvc:      grafana,
		DatasourceCache: datasourceCache,
	}
}

func (f *ForkedAlertmanagerApi) getService(ctx *models.ReqContext) (*LotexAM, error) {
	_, err := getDatasourceByUID(ctx, f.DatasourceCache, apimodels.AlertmanagerBackend)
	if err != nil {
		return nil, err
	}
	return f.AMSvc, nil
}

func (f *ForkedAlertmanagerApi) forkRouteGetAMStatus(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetAMStatus(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteCreateSilence(ctx *models.ReqContext, body apimodels.PostableSilence, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteCreateSilence(ctx, body)
}

func (f *ForkedAlertmanagerApi) forkRouteDeleteAlertingConfig(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteDeleteAlertingConfig(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteDeleteSilence(ctx *models.ReqContext, silenceID string, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteDeleteSilence(ctx, silenceID)
}

func (f *ForkedAlertmanagerApi) forkRouteGetAlertingConfig(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetAlertingConfig(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetAMAlertGroups(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetAMAlertGroups(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetAMAlerts(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetAMAlerts(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetSilence(ctx *models.ReqContext, silenceID string, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetSilence(ctx, silenceID)
}

func (f *ForkedAlertmanagerApi) forkRouteGetSilences(ctx *models.ReqContext, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RouteGetSilences(ctx)
}

func (f *ForkedAlertmanagerApi) forkRoutePostAlertingConfig(ctx *models.ReqContext, body apimodels.PostableUserConfig, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}
	if !body.AlertmanagerConfig.ReceiverType().Can(apimodels.AlertmanagerReceiverType) {
		return errorToResponse(backendTypeDoesNotMatchPayloadTypeError(apimodels.AlertmanagerBackend, body.AlertmanagerConfig.ReceiverType().String()))
	}
	return s.RoutePostAlertingConfig(ctx, body)
}

func (f *ForkedAlertmanagerApi) forkRoutePostAMAlerts(ctx *models.ReqContext, body apimodels.PostableAlerts, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RoutePostAMAlerts(ctx, body)
}

func (f *ForkedAlertmanagerApi) forkRoutePostTestReceivers(ctx *models.ReqContext, body apimodels.TestReceiversConfigBodyParams, dsUID string) response.Response {
	s, err := f.getService(ctx)
	if err != nil {
		return errorToResponse(err)
	}

	return s.RoutePostTestReceivers(ctx, body)
}

func (f *ForkedAlertmanagerApi) forkRouteDeleteGrafanaSilence(ctx *models.ReqContext, id string) response.Response {
	return f.GrafanaSvc.RouteDeleteSilence(ctx, id)
}

func (f *ForkedAlertmanagerApi) forkRouteDeleteGrafanaAlertingConfig(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteDeleteAlertingConfig(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteCreateGrafanaSilence(ctx *models.ReqContext, body apimodels.PostableSilence) response.Response {
	return f.GrafanaSvc.RouteCreateSilence(ctx, body)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaAMStatus(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteGetAMStatus(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaAMAlerts(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteGetAMAlerts(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaAMAlertGroups(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteGetAMAlertGroups(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaAlertingConfig(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteGetAlertingConfig(ctx)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaSilence(ctx *models.ReqContext, id string) response.Response {
	return f.GrafanaSvc.RouteGetSilence(ctx, id)
}

func (f *ForkedAlertmanagerApi) forkRouteGetGrafanaSilences(ctx *models.ReqContext) response.Response {
	return f.GrafanaSvc.RouteGetSilences(ctx)
}

func (f *ForkedAlertmanagerApi) forkRoutePostGrafanaAMAlerts(ctx *models.ReqContext, conf apimodels.PostableAlerts) response.Response {
	return f.GrafanaSvc.RoutePostAMAlerts(ctx, conf)
}

func (f *ForkedAlertmanagerApi) forkRoutePostGrafanaAlertingConfig(ctx *models.ReqContext, conf apimodels.PostableUserConfig) response.Response {
	if !conf.AlertmanagerConfig.ReceiverType().Can(apimodels.GrafanaReceiverType) {
		return errorToResponse(backendTypeDoesNotMatchPayloadTypeError(apimodels.GrafanaBackend, conf.AlertmanagerConfig.ReceiverType().String()))
	}
	return f.GrafanaSvc.RoutePostAlertingConfig(ctx, conf)
}

func (f *ForkedAlertmanagerApi) forkRoutePostTestGrafanaReceivers(ctx *models.ReqContext, conf apimodels.TestReceiversConfigBodyParams) response.Response {
	return f.GrafanaSvc.RoutePostTestReceivers(ctx, conf)
}
