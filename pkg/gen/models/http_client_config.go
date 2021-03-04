// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// HTTPClientConfig HTTPClientConfig configures an HTTP client.
//
// swagger:model HTTPClientConfig
type HTTPClientConfig struct {

	// basic auth
	BasicAuth *BasicAuth `json:"BasicAuth,omitempty"`

	// bearer token
	BearerToken Secret `json:"BearerToken,omitempty"`

	// The bearer token file for the targets.
	BearerTokenFile string `json:"BearerTokenFile,omitempty"`

	// proxy URL
	ProxyURL *URL `json:"ProxyURL,omitempty"`

	// TLS config
	TLSConfig *TLSConfig `json:"TLSConfig,omitempty"`
}

// Validate validates this HTTP client config
func (m *HTTPClientConfig) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateBasicAuth(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateBearerToken(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateProxyURL(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateTLSConfig(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *HTTPClientConfig) validateBasicAuth(formats strfmt.Registry) error {

	if swag.IsZero(m.BasicAuth) { // not required
		return nil
	}

	if m.BasicAuth != nil {
		if err := m.BasicAuth.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("BasicAuth")
			}
			return err
		}
	}

	return nil
}

func (m *HTTPClientConfig) validateBearerToken(formats strfmt.Registry) error {

	if swag.IsZero(m.BearerToken) { // not required
		return nil
	}

	if err := m.BearerToken.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("BearerToken")
		}
		return err
	}

	return nil
}

func (m *HTTPClientConfig) validateProxyURL(formats strfmt.Registry) error {

	if swag.IsZero(m.ProxyURL) { // not required
		return nil
	}

	if m.ProxyURL != nil {
		if err := m.ProxyURL.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("ProxyURL")
			}
			return err
		}
	}

	return nil
}

func (m *HTTPClientConfig) validateTLSConfig(formats strfmt.Registry) error {

	if swag.IsZero(m.TLSConfig) { // not required
		return nil
	}

	if m.TLSConfig != nil {
		if err := m.TLSConfig.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("TLSConfig")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *HTTPClientConfig) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *HTTPClientConfig) UnmarshalBinary(b []byte) error {
	var res HTTPClientConfig
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
