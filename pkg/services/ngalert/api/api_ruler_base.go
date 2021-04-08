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
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
)

type RulerApiService interface {
	RouteDeleteNamespaceRulesConfig(*models.ReqContext) response.Response
	RouteDeleteRuleGroupConfig(*models.ReqContext) response.Response
	RouteGetNamespaceRulesConfig(*models.ReqContext) response.Response
	RouteGetRulegGroupConfig(*models.ReqContext) response.Response
	RouteGetRulesConfig(*models.ReqContext) response.Response
	RoutePostNameRulesConfig(*models.ReqContext, apimodels.PostableRuleGroupConfig) response.Response
}

type RulerApiBase struct {
	log log.Logger
}

func (api *API) RegisterRulerApiEndpoints(srv RulerApiService) {
	api.RouteRegister.Group("", func(group routing.RouteRegister) {
		group.Delete(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules/{Namespace}"), routing.Wrap(srv.RouteDeleteNamespaceRulesConfig))
		group.Delete(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules/{Namespace}/{Groupname}"), routing.Wrap(srv.RouteDeleteRuleGroupConfig))
		group.Get(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules/{Namespace}"), routing.Wrap(srv.RouteGetNamespaceRulesConfig))
		group.Get(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules/{Namespace}/{Groupname}"), routing.Wrap(srv.RouteGetRulegGroupConfig))
		group.Get(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules"), routing.Wrap(srv.RouteGetRulesConfig))
		group.Post(toMacaronPath("/api/ruler/{Recipient}/api/v1/rules/{Namespace}"), binding.Bind(apimodels.PostableRuleGroupConfig{}), routing.Wrap(srv.RoutePostNameRulesConfig))
	}, middleware.ReqSignedIn)
}

func (base RulerApiBase) RouteDeleteNamespaceRulesConfig(c *models.ReqContext) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RouteDeleteNamespaceRulesConfig: ", "Recipient", recipient)
	namespace := c.Params(":Namespace")
	base.log.Info("RouteDeleteNamespaceRulesConfig: ", "Namespace", namespace)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base RulerApiBase) RouteDeleteRuleGroupConfig(c *models.ReqContext) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RouteDeleteRuleGroupConfig: ", "Recipient", recipient)
	namespace := c.Params(":Namespace")
	base.log.Info("RouteDeleteRuleGroupConfig: ", "Namespace", namespace)
	groupname := c.Params(":Groupname")
	base.log.Info("RouteDeleteRuleGroupConfig: ", "Groupname", groupname)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base RulerApiBase) RouteGetNamespaceRulesConfig(c *models.ReqContext) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RouteGetNamespaceRulesConfig: ", "Recipient", recipient)
	namespace := c.Params(":Namespace")
	base.log.Info("RouteGetNamespaceRulesConfig: ", "Namespace", namespace)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base RulerApiBase) RouteGetRulegGroupConfig(c *models.ReqContext) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RouteGetRulegGroupConfig: ", "Recipient", recipient)
	namespace := c.Params(":Namespace")
	base.log.Info("RouteGetRulegGroupConfig: ", "Namespace", namespace)
	groupname := c.Params(":Groupname")
	base.log.Info("RouteGetRulegGroupConfig: ", "Groupname", groupname)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base RulerApiBase) RouteGetRulesConfig(c *models.ReqContext) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RouteGetRulesConfig: ", "Recipient", recipient)
	return response.Error(http.StatusNotImplemented, "", nil)
}

func (base RulerApiBase) RoutePostNameRulesConfig(c *models.ReqContext, body apimodels.PostableRuleGroupConfig) response.Response {
	recipient := c.Params(":Recipient")
	base.log.Info("RoutePostNameRulesConfig: ", "Recipient", recipient)
	namespace := c.Params(":Namespace")
	base.log.Info("RoutePostNameRulesConfig: ", "Namespace", namespace)
	base.log.Info("RoutePostNameRulesConfig: ", "body", body)
	return response.Error(http.StatusNotImplemented, "", nil)
}
