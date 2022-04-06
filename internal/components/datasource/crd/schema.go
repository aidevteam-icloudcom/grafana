package crd

import (
	"reflect"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"

	"github.com/grafana/grafana/internal/components/datasource"
)

const (
	groupName = "datasource.core.grafana"
	// TODO this should be derived from the Thema synv.
	groupVersion = "v1alpha1"
)

var (
	// This schema is used for registering CRDs.
	//
	// TODO: this should be generated by Thema.
	schemaOpenapi = apiextensionsv1.JSONSchemaProps{
		Type: "object",
		Properties: map[string]apiextensionsv1.JSONSchemaProps{
			"spec": {
				Type: "object",
				Properties: map[string]apiextensionsv1.JSONSchemaProps{
					"type": {
						Type: "string",
					},
					"typeLogoUrl": {
						Type: "string",
					},
					"access": {
						Type: "string",
					},
					"url": {
						Type: "string",
					},
					"password": {
						Type: "string",
					},
					"user": {
						Type: "string",
					},
					"database": {
						Type: "string",
					},
					"basicAuth": {
						Type: "boolean",
					},
					"basicAuthUser": {
						Type: "string",
					},
					"basicAuthPassword": {
						Type: "string",
					},
					"withCredentials": {
						Type: "boolean",
					},
					"isDefault": {
						Type: "boolean",
					},
					"jsonData": {
						Type: "string",
					},
					"version": {
						Type: "integer",
					},
					"readOnly": {
						Type: "boolean",
					},
				},
			},
		},
	}
)

// Datasource is the Kubernetes-compatible Datasource definition.
//
// TODO: this should be generated by Thema.
type Datasource struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   datasource.Model `json:"spec,omitempty"`
	Status DatasourceStatus `json:"status,omitempty"`
}

// DeepCopyObject returns a deep copy of Datasource.
//
// TODO: this should be generated by Thema.
func (in *Datasource) DeepCopyObject() runtime.Object {
	val := reflect.ValueOf(in).Elem()

	cpy := reflect.New(val.Type())
	cpy.Elem().Set(val)

	ret, ok := cpy.Interface().(runtime.Object)
	if !ok {
		return nil
	}

	return ret
}

// DatasourceStatus is the status of a datasource (i.e. all API-controller fields go here).
//
// TODO: this should be generated by Thema.
type DatasourceStatus struct{}

// DatasourceList is a Kubernetes-compatible list of Datasource items.
//
// TODO: this should be generated by Thema.
type DatasourceList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Datasource `json:"items"`
}

// DeepCopyObject returns a deep copy of DatasourceList.
//
// TODO: this should be generated by Thema.
func (in *DatasourceList) DeepCopyObject() runtime.Object {
	val := reflect.ValueOf(in).Elem()

	cpy := reflect.New(val.Type())
	cpy.Elem().Set(val)

	ret, ok := cpy.Interface().(runtime.Object)
	if !ok {
		return nil
	}

	return ret
}
