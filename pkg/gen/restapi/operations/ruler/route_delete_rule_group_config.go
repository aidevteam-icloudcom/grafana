// Code generated by go-swagger; DO NOT EDIT.

package ruler

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the generate command

import (
	"net/http"

	"github.com/go-openapi/runtime/middleware"
)

// RouteDeleteRuleGroupConfigHandlerFunc turns a function with the right signature into a route delete rule group config handler
type RouteDeleteRuleGroupConfigHandlerFunc func(RouteDeleteRuleGroupConfigParams) middleware.Responder

// Handle executing the request and returning a response
func (fn RouteDeleteRuleGroupConfigHandlerFunc) Handle(params RouteDeleteRuleGroupConfigParams) middleware.Responder {
	return fn(params)
}

// RouteDeleteRuleGroupConfigHandler interface for that can handle valid route delete rule group config params
type RouteDeleteRuleGroupConfigHandler interface {
	Handle(RouteDeleteRuleGroupConfigParams) middleware.Responder
}

// NewRouteDeleteRuleGroupConfig creates a new http.Handler for the route delete rule group config operation
func NewRouteDeleteRuleGroupConfig(ctx *middleware.Context, handler RouteDeleteRuleGroupConfigHandler) *RouteDeleteRuleGroupConfig {
	return &RouteDeleteRuleGroupConfig{Context: ctx, Handler: handler}
}

/*RouteDeleteRuleGroupConfig swagger:route DELETE /ruler/{DatasourceId}/api/v1/rules/{Namespace}/{Groupname} ruler routeDeleteRuleGroupConfig

Delete rule group

*/
type RouteDeleteRuleGroupConfig struct {
	Context *middleware.Context
	Handler RouteDeleteRuleGroupConfigHandler
}

func (o *RouteDeleteRuleGroupConfig) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	route, rCtx, _ := o.Context.RouteInfo(r)
	if rCtx != nil {
		r = rCtx
	}
	var Params = NewRouteDeleteRuleGroupConfigParams()

	if err := o.Context.BindValidRequest(r, route, &Params); err != nil { // bind params
		o.Context.Respond(rw, r, route.Produces, route, err)
		return
	}

	res := o.Handler.Handle(Params) // actually handle the request

	o.Context.Respond(rw, r, route.Produces, route, res)

}
