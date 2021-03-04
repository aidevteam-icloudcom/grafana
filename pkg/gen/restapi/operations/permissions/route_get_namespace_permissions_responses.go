// Code generated by go-swagger; DO NOT EDIT.

package permissions

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/grafana/alerting-api/pkg/gen/models"
)

// RouteGetNamespacePermissionsOKCode is the HTTP code returned for type RouteGetNamespacePermissionsOK
const RouteGetNamespacePermissionsOKCode int = 200

/*RouteGetNamespacePermissionsOK Permissions

swagger:response routeGetNamespacePermissionsOK
*/
type RouteGetNamespacePermissionsOK struct {

	/*
	  In: Body
	*/
	Payload models.Permissions `json:"body,omitempty"`
}

// NewRouteGetNamespacePermissionsOK creates RouteGetNamespacePermissionsOK with default headers values
func NewRouteGetNamespacePermissionsOK() *RouteGetNamespacePermissionsOK {

	return &RouteGetNamespacePermissionsOK{}
}

// WithPayload adds the payload to the route get namespace permissions o k response
func (o *RouteGetNamespacePermissionsOK) WithPayload(payload models.Permissions) *RouteGetNamespacePermissionsOK {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get namespace permissions o k response
func (o *RouteGetNamespacePermissionsOK) SetPayload(payload models.Permissions) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetNamespacePermissionsOK) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(200)
	payload := o.Payload
	if payload == nil {
		// return empty array
		payload = models.Permissions{}
	}

	if err := producer.Produce(rw, payload); err != nil {
		panic(err) // let the recovery middleware deal with this
	}
}

// RouteGetNamespacePermissionsBadRequestCode is the HTTP code returned for type RouteGetNamespacePermissionsBadRequest
const RouteGetNamespacePermissionsBadRequestCode int = 400

/*RouteGetNamespacePermissionsBadRequest ValidationError

swagger:response routeGetNamespacePermissionsBadRequest
*/
type RouteGetNamespacePermissionsBadRequest struct {

	/*
	  In: Body
	*/
	Payload *models.ValidationError `json:"body,omitempty"`
}

// NewRouteGetNamespacePermissionsBadRequest creates RouteGetNamespacePermissionsBadRequest with default headers values
func NewRouteGetNamespacePermissionsBadRequest() *RouteGetNamespacePermissionsBadRequest {

	return &RouteGetNamespacePermissionsBadRequest{}
}

// WithPayload adds the payload to the route get namespace permissions bad request response
func (o *RouteGetNamespacePermissionsBadRequest) WithPayload(payload *models.ValidationError) *RouteGetNamespacePermissionsBadRequest {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the route get namespace permissions bad request response
func (o *RouteGetNamespacePermissionsBadRequest) SetPayload(payload *models.ValidationError) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *RouteGetNamespacePermissionsBadRequest) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(400)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
