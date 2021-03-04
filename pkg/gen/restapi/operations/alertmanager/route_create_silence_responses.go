// Code generated by go-swagger; DO NOT EDIT.

package alertmanager

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RouteCreateSilenceCreatedCode is the HTTP code returned for type RouteCreateSilenceCreated
const RouteCreateSilenceCreatedCode int = 201

/*RouteCreateSilenceCreated GettableSilence

swagger:response routeCreateSilenceCreated
*/
type RouteCreateSilenceCreated struct {

	/*
	  In: Body
	*/
	Payload *models.GettableSilence `json:"body,omitempty"`
}

// NewRouteCreateSilenceCreated creates RouteCreateSilenceCreated with default headers values
func NewRouteCreateSilenceCreated() *RouteCreateSilenceCreated {

	return &RouteCreateSilenceCreated{}
}

// WithPayload adds the payload to the route create silence created response
func (o *RouteCreateSilenceCreated) WithPayload(payload *models.GettableSilence) *RouteCreateSilenceCreated {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route create silence created response
func (o *RouteCreateSilenceCreated) SetPayload(payload *models.GettableSilence) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteCreateSilenceCreated) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(201)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}

// RouteCreateSilenceBadRequestCode is the HTTP code returned for type RouteCreateSilenceBadRequest
const RouteCreateSilenceBadRequestCode int = 400

/*RouteCreateSilenceBadRequest ValidationError

swagger:response routeCreateSilenceBadRequest
*/
type RouteCreateSilenceBadRequest struct {

	/*
	  In: Body
	*/
	Payload *models.ValidationError `json:"body,omitempty"`
}

// NewRouteCreateSilenceBadRequest creates RouteCreateSilenceBadRequest with default headers values
func NewRouteCreateSilenceBadRequest() *RouteCreateSilenceBadRequest {

	return &RouteCreateSilenceBadRequest{}
}

// WithPayload adds the payload to the route create silence bad request response
func (o *RouteCreateSilenceBadRequest) WithPayload(payload *models.ValidationError) *RouteCreateSilenceBadRequest {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route create silence bad request response
func (o *RouteCreateSilenceBadRequest) SetPayload(payload *models.ValidationError) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteCreateSilenceBadRequest) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(400)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
