// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"strconv"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
	"github.com/go-openapi/validate"
)

// GettableAlert GettableAlert gettable alert
//
// swagger:model GettableAlert
type GettableAlert struct {

	// ends at
	// Required: true
	// Format: date-time
	EndsAt *strfmt.DateTime `json:"endsAt"`

	// fingerprint
	// Required: true
	Fingerprint *string `json:"fingerprint"`

	// generator URL
	// Format: uri
	// Format: uri
	GeneratorURL strfmt.URI `json:"generatorURL,omitempty"`

	// receivers
	// Required: true
	Receivers []*Receiver `json:"receivers"`

	// starts at
	// Required: true
	// Format: date-time
	StartsAt *strfmt.DateTime `json:"startsAt"`

	// updated at
	// Required: true
	// Format: date-time
	UpdatedAt *strfmt.DateTime `json:"updatedAt"`

	// annotations
	// Required: true
	Annotations LabelSet `json:"annotations"`

	// labels
	// Required: true
	Labels LabelSet `json:"labels"`

	// status
	// Required: true
	Status *AlertStatus `json:"status"`
}

// Validate validates this gettable alert
func (m *GettableAlert) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateEndsAt(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateFingerprint(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateGeneratorURL(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateReceivers(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateStartsAt(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateUpdatedAt(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateAnnotations(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateLabels(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateStatus(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *GettableAlert) validateEndsAt(formats strfmt.Registry) error {

	if err := validate.Required("endsAt", "body", m.EndsAt); err != nil {
		return err
	}

	if err := validate.FormatOf("endsAt", "body", "date-time", m.EndsAt.String(), formats); err != nil {
		return err
	}

	return nil
}

func (m *GettableAlert) validateFingerprint(formats strfmt.Registry) error {

	if err := validate.Required("fingerprint", "body", m.Fingerprint); err != nil {
		return err
	}

	return nil
}

func (m *GettableAlert) validateGeneratorURL(formats strfmt.Registry) error {

	if swag.IsZero(m.GeneratorURL) { // not required
		return nil
	}

	if err := validate.FormatOf("generatorURL", "body", "uri", m.GeneratorURL.String(), formats); err != nil {
		return err
	}

	return nil
}

func (m *GettableAlert) validateReceivers(formats strfmt.Registry) error {

	if err := validate.Required("receivers", "body", m.Receivers); err != nil {
		return err
	}

	for i := 0; i < len(m.Receivers); i++ {
		if swag.IsZero(m.Receivers[i]) { // not required
			continue
		}

		if m.Receivers[i] != nil {
			if err := m.Receivers[i].Validate(formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("receivers" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

func (m *GettableAlert) validateStartsAt(formats strfmt.Registry) error {

	if err := validate.Required("startsAt", "body", m.StartsAt); err != nil {
		return err
	}

	if err := validate.FormatOf("startsAt", "body", "date-time", m.StartsAt.String(), formats); err != nil {
		return err
	}

	return nil
}

func (m *GettableAlert) validateUpdatedAt(formats strfmt.Registry) error {

	if err := validate.Required("updatedAt", "body", m.UpdatedAt); err != nil {
		return err
	}

	if err := validate.FormatOf("updatedAt", "body", "date-time", m.UpdatedAt.String(), formats); err != nil {
		return err
	}

	return nil
}

func (m *GettableAlert) validateAnnotations(formats strfmt.Registry) error {

	if err := m.Annotations.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("annotations")
		}
		return err
	}

	return nil
}

func (m *GettableAlert) validateLabels(formats strfmt.Registry) error {

	if err := m.Labels.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("labels")
		}
		return err
	}

	return nil
}

func (m *GettableAlert) validateStatus(formats strfmt.Registry) error {

	if err := validate.Required("status", "body", m.Status); err != nil {
		return err
	}

	if m.Status != nil {
		if err := m.Status.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("status")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *GettableAlert) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *GettableAlert) UnmarshalBinary(b []byte) error {
	var res GettableAlert
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
