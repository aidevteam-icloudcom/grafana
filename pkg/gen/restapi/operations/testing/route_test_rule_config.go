// Code generated by go-swagger; DO NOT EDIT.

package testing

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the generate command

import (
	"net/http"

	"github.com/go-openapi/runtime/middleware"
)

// RouteTestRuleConfigHandlerFunc turns a function with the right signature into a route test rule config handler
type RouteTestRuleConfigHandlerFunc func(RouteTestRuleConfigParams) middleware.Responder

// Handle executing the request and returning a response
func (fn RouteTestRuleConfigHandlerFunc) Handle(params RouteTestRuleConfigParams) middleware.Responder {
	return fn(params)
}

// RouteTestRuleConfigHandler interface for that can handle valid route test rule config params
type RouteTestRuleConfigHandler interface {
	Handle(RouteTestRuleConfigParams) middleware.Responder
}

// NewRouteTestRuleConfig creates a new http.Handler for the route test rule config operation
func NewRouteTestRuleConfig(ctx *middleware.Context, handler RouteTestRuleConfigHandler) *RouteTestRuleConfig {
	return &RouteTestRuleConfig{Context: ctx, Handler: handler}
}

/*RouteTestRuleConfig swagger:route GET /api/v1/rule/test testing routeTestRuleConfig

Test rule

*/
type RouteTestRuleConfig struct {
	Context *middleware.Context
	Handler RouteTestRuleConfigHandler
}

func (o *RouteTestRuleConfig) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	route, rCtx, _ := o.Context.RouteInfo(r)
	if rCtx != nil {
		r = rCtx
	}
	var Params = NewRouteTestRuleConfigParams()

	if err := o.Context.BindValidRequest(r, route, &Params); err != nil { // bind params
		o.Context.Respond(rw, r, route.Produces, route, err)
		return
	}

	res := o.Handler.Handle(Params) // actually handle the request

	o.Context.Respond(rw, r, route.Produces, route, res)

}
