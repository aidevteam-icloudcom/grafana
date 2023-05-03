// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     GoResourceTypes
//
// Run 'make gen-cue' from repository root to regenerate.

package serviceaccount

// Defines values for OrgRole.
const (
	OrgRoleAdmin  OrgRole = "Admin"
	OrgRoleEditor OrgRole = "Editor"
	OrgRoleViewer OrgRole = "Viewer"
)

// OrgRole is a Grafana Organization Role which can be 'Viewer', 'Editor', 'Admin'.
type OrgRole string

// Spec defines model for Spec.
type Spec struct {
	// AccessControl metadata associated with a given resource.
	AccessControl map[string]bool `json:"accessControl,omitempty"`

	// AvatarUrl is the service account's avatar URL. It allows the frontend to display a picture in front
	// of the service account.
	AvatarUrl string `json:"avatarUrl"`

	// ID is the unique identifier of the service account in the database.
	Id int64 `json:"id"`

	// IsDisabled indicates if the service account is disabled.
	IsDisabled bool `json:"isDisabled"`

	// Login of the service account.
	Login string `json:"login"`

	// Name of the service account.
	Name string `json:"name"`

	// OrgId is the ID of an organisation the service account belongs to.
	OrgId int64 `json:"orgId"`

	// OrgRole is a Grafana Organization Role which can be 'Viewer', 'Editor', 'Admin'.
	Role OrgRole `json:"role"`

	// Teams is a list of teams the service account belongs to.
	Teams []string `json:"teams,omitempty"`

	// Tokens is the number of active tokens for the service account.
	// Tokens are used to authenticate the service account against Grafana.
	Tokens int64 `json:"tokens"`
}
