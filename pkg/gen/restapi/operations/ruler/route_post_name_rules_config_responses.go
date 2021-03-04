// Code generated by go-swagger; DO NOT EDIT.

package ruler

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RoutePostNameRulesConfigAcceptedCode is the HTTP code returned for type RoutePostNameRulesConfigAccepted
const RoutePostNameRulesConfigAcceptedCode int = 202

/*RoutePostNameRulesConfigAccepted Ack

swagger:response routePostNameRulesConfigAccepted
*/
type RoutePostNameRulesConfigAccepted struct {

	/*
	  In: Body
	*/
	Payload models.Ack `json:"body,omitempty"`
}

// NewRoutePostNameRulesConfigAccepted creates RoutePostNameRulesConfigAccepted with default headers values
func NewRoutePostNameRulesConfigAccepted() *RoutePostNameRulesConfigAccepted {

	return &RoutePostNameRulesConfigAccepted{}
}

// WithPayload adds the payload to the route post name rules config accepted response
func (o *RoutePostNameRulesConfigAccepted) WithPayload(payload models.Ack) *RoutePostNameRulesConfigAccepted {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route post name rules config accepted response
func (o *RoutePostNameRulesConfigAccepted) SetPayload(payload models.Ack) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RoutePostNameRulesConfigAccepted) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(202)
	payload := o.Payload
	if err := producer.Produce(rw, payload); err != nil {
		panic(err) // let the recovery middleware deal with this
	}
}
