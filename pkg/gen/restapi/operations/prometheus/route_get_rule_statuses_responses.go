// Code generated by go-swagger; DO NOT EDIT.

package prometheus

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RouteGetRuleStatusesOKCode is the HTTP code returned for type RouteGetRuleStatusesOK
const RouteGetRuleStatusesOKCode int = 200

/*RouteGetRuleStatusesOK RuleResponse

swagger:response routeGetRuleStatusesOK
*/
type RouteGetRuleStatusesOK struct {

	/*
	  In: Body
	*/
	Payload *models.RuleResponse `json:"body,omitempty"`
}

// NewRouteGetRuleStatusesOK creates RouteGetRuleStatusesOK with default headers values
func NewRouteGetRuleStatusesOK() *RouteGetRuleStatusesOK {

	return &RouteGetRuleStatusesOK{}
}

// WithPayload adds the payload to the route get rule statuses o k response
func (o *RouteGetRuleStatusesOK) WithPayload(payload *models.RuleResponse) *RouteGetRuleStatusesOK {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get rule statuses o k response
func (o *RouteGetRuleStatusesOK) SetPayload(payload *models.RuleResponse) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetRuleStatusesOK) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(200)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
