// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"strconv"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// OpsGenieConfig OpsGenieConfig configures notifications via OpsGenie.
//
// swagger:model OpsGenieConfig
type OpsGenieConfig struct {

	// description
	Description string `json:"description,omitempty"`

	// details
	Details map[string]string `json:"details,omitempty"`

	// message
	Message string `json:"message,omitempty"`

	// note
	Note string `json:"note,omitempty"`

	// priority
	Priority string `json:"priority,omitempty"`

	// responders
	Responders []*OpsGenieConfigResponder `json:"responders"`

	// source
	Source string `json:"source,omitempty"`

	// tags
	Tags string `json:"tags,omitempty"`

	// v send resolved
	VSendResolved bool `json:"send_resolved,omitempty"`

	// api key
	APIKey Secret `json:"api_key,omitempty"`

	// api url
	APIURL *URL `json:"api_url,omitempty"`

	// http config
	HTTPConfig *HTTPClientConfig `json:"http_config,omitempty"`
}

// Validate validates this ops genie config
func (m *OpsGenieConfig) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateResponders(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateAPIKey(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateAPIURL(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateHTTPConfig(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *OpsGenieConfig) validateResponders(formats strfmt.Registry) error {

	if swag.IsZero(m.Responders) { // not required
		return nil
	}

	for i := 0; i < len(m.Responders); i++ {
		if swag.IsZero(m.Responders[i]) { // not required
			continue
		}

		if m.Responders[i] != nil {
			if err := m.Responders[i].Validate(formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("responders" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

func (m *OpsGenieConfig) validateAPIKey(formats strfmt.Registry) error {

	if swag.IsZero(m.APIKey) { // not required
		return nil
	}

	if err := m.APIKey.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("api_key")
		}
		return err
	}

	return nil
}

func (m *OpsGenieConfig) validateAPIURL(formats strfmt.Registry) error {

	if swag.IsZero(m.APIURL) { // not required
		return nil
	}

	if m.APIURL != nil {
		if err := m.APIURL.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("api_url")
			}
			return err
		}
	}

	return nil
}

func (m *OpsGenieConfig) validateHTTPConfig(formats strfmt.Registry) error {

	if swag.IsZero(m.HTTPConfig) { // not required
		return nil
	}

	if m.HTTPConfig != nil {
		if err := m.HTTPConfig.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("http_config")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *OpsGenieConfig) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *OpsGenieConfig) UnmarshalBinary(b []byte) error {
	var res OpsGenieConfig
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
