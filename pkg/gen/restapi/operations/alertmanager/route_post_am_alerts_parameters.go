// Code generated by go-swagger; DO NOT EDIT.

package alertmanager

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/runtime/middleware"
	"github.com/go-openapi/strfmt"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// NewRoutePostAmAlertsParams creates a new RoutePostAmAlertsParams object
// no default values defined in spec.
func NewRoutePostAmAlertsParams() RoutePostAmAlertsParams {

	return RoutePostAmAlertsParams{}
}

// RoutePostAmAlertsParams contains all the bound params for the route post am alerts operation
// typically these are obtained from a http.Request
//
// swagger:parameters RoutePostAmAlerts
type RoutePostAmAlertsParams struct {

	// HTTP Request Object
	HTTPRequest *http.Request `json:"-"`

	/*
	  Required: true
	  In: path
	*/
	DatasourceID string
	/*
	  In: body
	*/
	PostableAlerts []*models.PostableAlert
}

// BindRequest both binds and validates a request, it assumes that complex things implement a Validatable(strfmt.Registry) error interface
// for simple values it will use straight method calls.
//
// To ensure default values, the struct must have been initialized with NewRoutePostAmAlertsParams() beforehand.
func (o *RoutePostAmAlertsParams) BindRequest(r *http.Request, route *middleware.MatchedRoute) error {
	var res []error

	o.HTTPRequest = r

	rDatasourceID, rhkDatasourceID, _ := route.Params.GetOK("DatasourceId")
	if err := o.bindDatasourceID(rDatasourceID, rhkDatasourceID, route.Formats); err != nil {
		res = append(res, err)
	}

	if runtime.HasBody(r) {
		defer r.Body.Close()
		var body []*models.PostableAlert
		if err := route.Consumer.Consume(r.Body, &body); err != nil {
			res = append(res, errors.NewParseError("postableAlerts", "body", "", err))
		} else {
			// validate array of body objects
			for i := range body {
				if body[i] == nil {
					continue
				}
				if err := body[i].Validate(route.Formats); err != nil {
					res = append(res, err)
					break
				}
			}
			if len(res) == 0 {
				o.PostableAlerts = body
			}
		}
	}
	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

// bindDatasourceID binds and validates parameter DatasourceID from path.
func (o *RoutePostAmAlertsParams) bindDatasourceID(rawData []string, hasKey bool, formats strfmt.Registry) error {
	var raw string
	if len(rawData) > 0 {
		raw = rawData[len(rawData)-1]
	}

	// Required: true
	// Parameter is provided by construction from the route

	o.DatasourceID = raw

	return nil
}
