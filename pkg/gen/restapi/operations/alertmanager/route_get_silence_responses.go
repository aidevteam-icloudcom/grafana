// Code generated by go-swagger; DO NOT EDIT.

package alertmanager

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RouteGetSilenceOKCode is the HTTP code returned for type RouteGetSilenceOK
const RouteGetSilenceOKCode int = 200

/*RouteGetSilenceOK GettableSilence

swagger:response routeGetSilenceOK
*/
type RouteGetSilenceOK struct {

	/*
	  In: Body
	*/
	Payload *models.GettableSilence `json:"body,omitempty"`
}

// NewRouteGetSilenceOK creates RouteGetSilenceOK with default headers values
func NewRouteGetSilenceOK() *RouteGetSilenceOK {

	return &RouteGetSilenceOK{}
}

// WithPayload adds the payload to the route get silence o k response
func (o *RouteGetSilenceOK) WithPayload(payload *models.GettableSilence) *RouteGetSilenceOK {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get silence o k response
func (o *RouteGetSilenceOK) SetPayload(payload *models.GettableSilence) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetSilenceOK) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(200)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}

// RouteGetSilenceBadRequestCode is the HTTP code returned for type RouteGetSilenceBadRequest
const RouteGetSilenceBadRequestCode int = 400

/*RouteGetSilenceBadRequest ValidationError

swagger:response routeGetSilenceBadRequest
*/
type RouteGetSilenceBadRequest struct {

	/*
	  In: Body
	*/
	Payload *models.ValidationError `json:"body,omitempty"`
}

// NewRouteGetSilenceBadRequest creates RouteGetSilenceBadRequest with default headers values
func NewRouteGetSilenceBadRequest() *RouteGetSilenceBadRequest {

	return &RouteGetSilenceBadRequest{}
}

// WithPayload adds the payload to the route get silence bad request response
func (o *RouteGetSilenceBadRequest) WithPayload(payload *models.ValidationError) *RouteGetSilenceBadRequest {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get silence bad request response
func (o *RouteGetSilenceBadRequest) SetPayload(payload *models.ValidationError) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetSilenceBadRequest) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(400)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
