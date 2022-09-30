/*Package api contains base API implementation of unified alerting
 *
 *Generated by: Swagger Codegen (https://github.com/swagger-api/swagger-codegen.git)
 *
 *Do not manually edit these files, please find ngalert/api/swagger-codegen/ for commands on how to generate them.
 */
package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/services/ngalert/metrics"
	"github.com/grafana/grafana/pkg/web"
)

type AlertmanagerApi interface {
	RouteCreateGrafanaSilence(*models.ReqContext) response.Response
	RouteCreateSilence(*models.ReqContext) response.Response
	RouteDeleteAlertingConfig(*models.ReqContext) response.Response
	RouteDeleteGrafanaAlertingConfig(*models.ReqContext) response.Response
	RouteDeleteGrafanaSilence(*models.ReqContext) response.Response
	RouteDeleteSilence(*models.ReqContext) response.Response
	RouteGetAMAlertGroups(*models.ReqContext) response.Response
	RouteGetAMAlerts(*models.ReqContext) response.Response
	RouteGetAMStatus(*models.ReqContext) response.Response
	RouteGetAlertingConfig(*models.ReqContext) response.Response
	RouteGetGrafanaAMAlertGroups(*models.ReqContext) response.Response
	RouteGetGrafanaAMAlerts(*models.ReqContext) response.Response
	RouteGetGrafanaAMStatus(*models.ReqContext) response.Response
	RouteGetGrafanaAlertingConfig(*models.ReqContext) response.Response
	RouteGetGrafanaSilence(*models.ReqContext) response.Response
	RouteGetGrafanaSilences(*models.ReqContext) response.Response
	RouteGetSilence(*models.ReqContext) response.Response
	RouteGetSilences(*models.ReqContext) response.Response
	RoutePostAMAlerts(*models.ReqContext) response.Response
	RoutePostAlertingConfig(*models.ReqContext) response.Response
	RoutePostGrafanaAMAlerts(*models.ReqContext) response.Response
	RoutePostGrafanaAlertingConfig(*models.ReqContext) response.Response
	RoutePostTestGrafanaReceivers(*models.ReqContext) response.Response
	RoutePostTestReceivers(*models.ReqContext) response.Response
}

func (f *AlertmanagerApiHandler) RouteCreateGrafanaSilence(ctx *models.ReqContext) response.Response {
	// Parse Request Body
	conf := apimodels.PostableSilence{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRouteCreateGrafanaSilence(ctx, conf)
}
func (f *AlertmanagerApiHandler) RouteCreateSilence(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	// Parse Request Body
	conf := apimodels.PostableSilence{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRouteCreateSilence(ctx, conf, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteDeleteAlertingConfig(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteDeleteAlertingConfig(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteDeleteGrafanaAlertingConfig(ctx *models.ReqContext) response.Response {
	return f.handleRouteDeleteGrafanaAlertingConfig(ctx)
}
func (f *AlertmanagerApiHandler) RouteDeleteGrafanaSilence(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	silenceIdParam := web.Params(ctx.Req)[":SilenceId"]
	return f.handleRouteDeleteGrafanaSilence(ctx, silenceIdParam)
}
func (f *AlertmanagerApiHandler) RouteDeleteSilence(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	silenceIdParam := web.Params(ctx.Req)[":SilenceId"]
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteDeleteSilence(ctx, silenceIdParam, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetAMAlertGroups(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetAMAlertGroups(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetAMAlerts(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetAMAlerts(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetAMStatus(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetAMStatus(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetAlertingConfig(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetAlertingConfig(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaAMAlertGroups(ctx *models.ReqContext) response.Response {
	return f.handleRouteGetGrafanaAMAlertGroups(ctx)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaAMAlerts(ctx *models.ReqContext) response.Response {
	return f.handleRouteGetGrafanaAMAlerts(ctx)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaAMStatus(ctx *models.ReqContext) response.Response {
	return f.handleRouteGetGrafanaAMStatus(ctx)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaAlertingConfig(ctx *models.ReqContext) response.Response {
	return f.handleRouteGetGrafanaAlertingConfig(ctx)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaSilence(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	silenceIdParam := web.Params(ctx.Req)[":SilenceId"]
	return f.handleRouteGetGrafanaSilence(ctx, silenceIdParam)
}
func (f *AlertmanagerApiHandler) RouteGetGrafanaSilences(ctx *models.ReqContext) response.Response {
	return f.handleRouteGetGrafanaSilences(ctx)
}
func (f *AlertmanagerApiHandler) RouteGetSilence(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	silenceIdParam := web.Params(ctx.Req)[":SilenceId"]
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetSilence(ctx, silenceIdParam, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RouteGetSilences(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	return f.handleRouteGetSilences(ctx, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RoutePostAMAlerts(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	// Parse Request Body
	conf := apimodels.PostableAlerts{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostAMAlerts(ctx, conf, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RoutePostAlertingConfig(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	// Parse Request Body
	conf := apimodels.PostableUserConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostAlertingConfig(ctx, conf, datasourceUIDParam)
}
func (f *AlertmanagerApiHandler) RoutePostGrafanaAMAlerts(ctx *models.ReqContext) response.Response {
	// Parse Request Body
	conf := apimodels.PostableAlerts{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostGrafanaAMAlerts(ctx, conf)
}
func (f *AlertmanagerApiHandler) RoutePostGrafanaAlertingConfig(ctx *models.ReqContext) response.Response {
	// Parse Request Body
	conf := apimodels.PostableUserConfig{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostGrafanaAlertingConfig(ctx, conf)
}
func (f *AlertmanagerApiHandler) RoutePostTestGrafanaReceivers(ctx *models.ReqContext) response.Response {
	// Parse Request Body
	conf := apimodels.TestReceiversConfigBodyParams{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostTestGrafanaReceivers(ctx, conf)
}
func (f *AlertmanagerApiHandler) RoutePostTestReceivers(ctx *models.ReqContext) response.Response {
	// Parse Path Parameters
	datasourceUIDParam := web.Params(ctx.Req)[":DatasourceUID"]
	// Parse Request Body
	conf := apimodels.TestReceiversConfigBodyParams{}
	if err := web.Bind(ctx.Req, &conf); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	return f.handleRoutePostTestReceivers(ctx, conf, datasourceUIDParam)
}

func (api *API) RegisterAlertmanagerApiEndpoints(srv AlertmanagerApi, m *metrics.API) {
	api.RouteRegister.Group("", func(group routing.RouteRegister) {
		group.Post(
			toMacaronPath("/api/alertmanager/grafana/api/v2/silences"),
			api.authorize(http.MethodPost, "/api/alertmanager/grafana/api/v2/silences"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/grafana/api/v2/silences",
				srv.RouteCreateGrafanaSilence,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/silences"),
			api.authorize(http.MethodPost, "/api/alertmanager/{DatasourceUID}/api/v2/silences"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/{DatasourceUID}/api/v2/silences",
				srv.RouteCreateSilence,
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			api.authorize(http.MethodDelete, "/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/alertmanager/{DatasourceUID}/config/api/v1/alerts",
				srv.RouteDeleteAlertingConfig,
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/alertmanager/grafana/config/api/v1/alerts"),
			api.authorize(http.MethodDelete, "/api/alertmanager/grafana/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/alertmanager/grafana/config/api/v1/alerts",
				srv.RouteDeleteGrafanaAlertingConfig,
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/alertmanager/grafana/api/v2/silence/{SilenceId}"),
			api.authorize(http.MethodDelete, "/api/alertmanager/grafana/api/v2/silence/{SilenceId}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/alertmanager/grafana/api/v2/silence/{SilenceId}",
				srv.RouteDeleteGrafanaSilence,
				m,
			),
		)
		group.Delete(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}"),
			api.authorize(http.MethodDelete, "/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}"),
			metrics.Instrument(
				http.MethodDelete,
				"/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}",
				srv.RouteDeleteSilence,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/alerts/groups"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/api/v2/alerts/groups"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/api/v2/alerts/groups",
				srv.RouteGetAMAlertGroups,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/alerts"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/api/v2/alerts"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/api/v2/alerts",
				srv.RouteGetAMAlerts,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/status"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/api/v2/status"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/api/v2/status",
				srv.RouteGetAMStatus,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/config/api/v1/alerts",
				srv.RouteGetAlertingConfig,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/api/v2/alerts/groups"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/api/v2/alerts/groups"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/api/v2/alerts/groups",
				srv.RouteGetGrafanaAMAlertGroups,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/api/v2/alerts"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/api/v2/alerts"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/api/v2/alerts",
				srv.RouteGetGrafanaAMAlerts,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/api/v2/status"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/api/v2/status"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/api/v2/status",
				srv.RouteGetGrafanaAMStatus,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/config/api/v1/alerts"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/config/api/v1/alerts",
				srv.RouteGetGrafanaAlertingConfig,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/api/v2/silence/{SilenceId}"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/api/v2/silence/{SilenceId}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/api/v2/silence/{SilenceId}",
				srv.RouteGetGrafanaSilence,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/grafana/api/v2/silences"),
			api.authorize(http.MethodGet, "/api/alertmanager/grafana/api/v2/silences"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/grafana/api/v2/silences",
				srv.RouteGetGrafanaSilences,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/api/v2/silence/{SilenceId}",
				srv.RouteGetSilence,
				m,
			),
		)
		group.Get(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/silences"),
			api.authorize(http.MethodGet, "/api/alertmanager/{DatasourceUID}/api/v2/silences"),
			metrics.Instrument(
				http.MethodGet,
				"/api/alertmanager/{DatasourceUID}/api/v2/silences",
				srv.RouteGetSilences,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/api/v2/alerts"),
			api.authorize(http.MethodPost, "/api/alertmanager/{DatasourceUID}/api/v2/alerts"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/{DatasourceUID}/api/v2/alerts",
				srv.RoutePostAMAlerts,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			api.authorize(http.MethodPost, "/api/alertmanager/{DatasourceUID}/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/{DatasourceUID}/config/api/v1/alerts",
				srv.RoutePostAlertingConfig,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/grafana/api/v2/alerts"),
			api.authorize(http.MethodPost, "/api/alertmanager/grafana/api/v2/alerts"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/grafana/api/v2/alerts",
				srv.RoutePostGrafanaAMAlerts,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/grafana/config/api/v1/alerts"),
			api.authorize(http.MethodPost, "/api/alertmanager/grafana/config/api/v1/alerts"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/grafana/config/api/v1/alerts",
				srv.RoutePostGrafanaAlertingConfig,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/grafana/config/api/v1/receivers/test"),
			api.authorize(http.MethodPost, "/api/alertmanager/grafana/config/api/v1/receivers/test"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/grafana/config/api/v1/receivers/test",
				srv.RoutePostTestGrafanaReceivers,
				m,
			),
		)
		group.Post(
			toMacaronPath("/api/alertmanager/{DatasourceUID}/config/api/v1/receivers/test"),
			api.authorize(http.MethodPost, "/api/alertmanager/{DatasourceUID}/config/api/v1/receivers/test"),
			metrics.Instrument(
				http.MethodPost,
				"/api/alertmanager/{DatasourceUID}/config/api/v1/receivers/test",
				srv.RoutePostTestReceivers,
				m,
			),
		)
	}, middleware.ReqSignedIn)
}
