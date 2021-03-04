// Code generated by go-swagger; DO NOT EDIT.

package alertmanager

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the generate command

import (
	"net/http"

	"github.com/go-openapi/runtime/middleware"
)

// RoutePostAmAlertsHandlerFunc turns a function with the right signature into a route post am alerts handler
type RoutePostAmAlertsHandlerFunc func(RoutePostAmAlertsParams) middleware.Responder

// Handle executing the request and returning a response
func (fn RoutePostAmAlertsHandlerFunc) Handle(params RoutePostAmAlertsParams) middleware.Responder {
	return fn(params)
}

// RoutePostAmAlertsHandler interface for that can handle valid route post am alerts params
type RoutePostAmAlertsHandler interface {
	Handle(RoutePostAmAlertsParams) middleware.Responder
}

// NewRoutePostAmAlerts creates a new http.Handler for the route post am alerts operation
func NewRoutePostAmAlerts(ctx *middleware.Context, handler RoutePostAmAlertsHandler) *RoutePostAmAlerts {
	return &RoutePostAmAlerts{Context: ctx, Handler: handler}
}

/*RoutePostAmAlerts swagger:route POST /alertmanager/{DatasourceId}/api/v2/alerts alertmanager routePostAmAlerts

create alertmanager alerts

*/
type RoutePostAmAlerts struct {
	Context *middleware.Context
	Handler RoutePostAmAlertsHandler
}

func (o *RoutePostAmAlerts) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	route, rCtx, _ := o.Context.RouteInfo(r)
	if rCtx != nil {
		r = rCtx
	}
	var Params = NewRoutePostAmAlertsParams()

	if err := o.Context.BindValidRequest(r, route, &Params); err != nil { // bind params
		o.Context.Respond(rw, r, route.Produces, route, err)
		return
	}

	res := o.Handler.Handle(Params) // actually handle the request

	o.Context.Respond(rw, r, route.Produces, route, res)

}
