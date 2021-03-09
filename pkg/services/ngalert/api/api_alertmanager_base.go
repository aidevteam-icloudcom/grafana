/*Package api contains base API implementation of unified alerting
 *
 * Generated by: Swagger Codegen (https://github.com/swagger-api/swagger-codegen.git)
 *
 * Need to remove unused imports.
 */
package api

import (
	"net/http"

	"github.com/go-macaron/binding"
	apimodels "github.com/grafana/alerting-api/pkg/api"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
)

type AlertmanagerApiService interface {
	RouteCreateSilence(*models.ReqContext, apimodels.SilenceBody) response.Response
	RouteDeleteAlertingConfig(*models.ReqContext) response.Response
	RouteDeleteSilence(*models.ReqContext) response.Response
	RouteGetAlertingConfig(*models.ReqContext) response.Response
	RouteGetAmAlertGroups(*models.ReqContext) response.Response
	RouteGetAmAlerts(*models.ReqContext) response.Response
	RouteGetSilence(*models.ReqContext) response.Response
	RouteGetSilences(*models.ReqContext) response.Response
	RoutePostAlertingConfig(*models.ReqContext, apimodels.UserConfig) response.Response
	RoutePostAmAlerts(*models.ReqContext, apimodels.PostableAlerts) response.Response
}

type AlertmanagerApiBase struct {
	log log.Logger
}

func (api *API) RegisterAlertmanagerApiEndpoints(srv AlertmanagerApiService) {
	api.RouteRegister.Group("", func(group routing.RouteRegister) {
		group.Post(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/silences"), binding.Bind(apimodels.SilenceBody{}), routing.Wrap(srv.RouteCreateSilence))
		group.Delete(toMacaronPath("/alertmanager/{DatasourceId}/config/api/v1/alerts"), routing.Wrap(srv.RouteDeleteAlertingConfig))
		group.Delete(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/silence/{SilenceId}"), routing.Wrap(srv.RouteDeleteSilence))
		group.Get(toMacaronPath("/alertmanager/{DatasourceId}/config/api/v1/alerts"), routing.Wrap(srv.RouteGetAlertingConfig))
		group.Get(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/alerts/groups"), routing.Wrap(srv.RouteGetAmAlertGroups))
		group.Get(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/alerts"), routing.Wrap(srv.RouteGetAmAlerts))
		group.Get(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/silence/{SilenceId}"), routing.Wrap(srv.RouteGetSilence))
		group.Get(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/silences"), routing.Wrap(srv.RouteGetSilences))
		group.Post(toMacaronPath("/alertmanager/{DatasourceId}/config/api/v1/alerts"), binding.Bind(apimodels.UserConfig{}), routing.Wrap(srv.RoutePostAlertingConfig))
		group.Post(toMacaronPath("/alertmanager/{DatasourceId}/api/v2/alerts"), binding.Bind(apimodels.PostableAlerts{}), routing.Wrap(srv.RoutePostAmAlerts))
	})
}

func (base AlertmanagerApiBase) RouteCreateSilence(c *models.ReqContext, body apimodels.SilenceBody) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteCreateSilence: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteDeleteAlertingConfig(c *models.ReqContext) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteDeleteAlertingConfig: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteDeleteSilence(c *models.ReqContext) response.Response {
	silenceId := c.Params(":SilenceId")
	base.log.Info("RouteDeleteSilence: ", "SilenceId", silenceId)
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteDeleteSilence: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteGetAlertingConfig(c *models.ReqContext) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteGetAlertingConfig: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteGetAmAlertGroups(c *models.ReqContext) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteGetAmAlertGroups: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteGetAmAlerts(c *models.ReqContext) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteGetAmAlerts: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteGetSilence(c *models.ReqContext) response.Response {
	silenceId := c.Params(":SilenceId")
	base.log.Info("RouteGetSilence: ", "SilenceId", silenceId)
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteGetSilence: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RouteGetSilences(c *models.ReqContext) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RouteGetSilences: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RoutePostAlertingConfig(c *models.ReqContext, body apimodels.UserConfig) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RoutePostAlertingConfig: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base AlertmanagerApiBase) RoutePostAmAlerts(c *models.ReqContext, body apimodels.PostableAlerts) response.Response {
	datasourceId := c.Params(":DatasourceId")
	base.log.Info("RoutePostAmAlerts: ", "DatasourceId", datasourceId)
	return response.Error(http.StatusNotImplemented, "", nil)
}
