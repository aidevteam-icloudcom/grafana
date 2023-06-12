// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     GoTypesJenny
//
// Run 'make gen-cue' from repository root to regenerate.

package librarypanel

import (
	"github.com/grafana/grafana/pkg/kinds"
)

// Resource is the kubernetes style representation of LibraryPanel. (TODO be better)
type K8sResource = kinds.GrafanaResource[Spec, Status]

// NewResource creates a new instance of the resource with a given name (UID)
func NewK8sResource(name string, s *Spec) K8sResource {
	return K8sResource{
		Kind:       "LibraryPanel",
		APIVersion: "v0.0-alpha",
		Metadata: kinds.GrafanaResourceMetadata{
			Name:        name,
			Annotations: make(map[string]string),
			Labels:      make(map[string]string),
		},
		Spec: s,
	}
}


// Resource is the wire representation of LibraryPanel.
// It currently will soon be merged into the k8s flavor (TODO be better)
type Resource struct {
	Metadata Metadata `json:"metadata"`
	Spec Spec `json:"spec"`
	Status Status `json:"status"`
}
