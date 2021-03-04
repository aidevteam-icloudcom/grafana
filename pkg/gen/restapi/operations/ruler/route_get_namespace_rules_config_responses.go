// Code generated by go-swagger; DO NOT EDIT.

package ruler

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RouteGetNamespaceRulesConfigAcceptedCode is the HTTP code returned for type RouteGetNamespaceRulesConfigAccepted
const RouteGetNamespaceRulesConfigAcceptedCode int = 202

/*RouteGetNamespaceRulesConfigAccepted NamespaceConfigResponse

swagger:response routeGetNamespaceRulesConfigAccepted
*/
type RouteGetNamespaceRulesConfigAccepted struct {

	/*
	  In: Body
	*/
	Payload models.NamespaceConfigResponse `json:"body,omitempty"`
}

// NewRouteGetNamespaceRulesConfigAccepted creates RouteGetNamespaceRulesConfigAccepted with default headers values
func NewRouteGetNamespaceRulesConfigAccepted() *RouteGetNamespaceRulesConfigAccepted {

	return &RouteGetNamespaceRulesConfigAccepted{}
}

// WithPayload adds the payload to the route get namespace rules config accepted response
func (o *RouteGetNamespaceRulesConfigAccepted) WithPayload(payload models.NamespaceConfigResponse) *RouteGetNamespaceRulesConfigAccepted {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get namespace rules config accepted response
func (o *RouteGetNamespaceRulesConfigAccepted) SetPayload(payload models.NamespaceConfigResponse) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetNamespaceRulesConfigAccepted) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(202)
	payload := o.Payload
	if payload == nil {
		// return empty map
		payload = models.NamespaceConfigResponse{}
	}

	if err := producer.Produce(rw, payload); err != nil {
		panic(err) // let the recovery middleware deal with this
	}
}
