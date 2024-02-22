//go:build !ignore_autogenerated
// +build !ignore_autogenerated

// SPDX-License-Identifier: AGPL-3.0-only

// Code generated by openapi-gen. DO NOT EDIT.

// This file was autogenerated by openapi-gen. Do not edit it manually!

package v0alpha1

import (
	common "k8s.io/kube-openapi/pkg/common"
	spec "k8s.io/kube-openapi/pkg/validation/spec"
)

func GetOpenAPIDefinitions(ref common.ReferenceCallback) map[string]common.OpenAPIDefinition {
	return map[string]common.OpenAPIDefinition{
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.Feature":             schema_pkg_apis_featuretoggle_v0alpha1_Feature(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureList":         schema_pkg_apis_featuretoggle_v0alpha1_FeatureList(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureSpec":         schema_pkg_apis_featuretoggle_v0alpha1_FeatureSpec(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureToggles":      schema_pkg_apis_featuretoggle_v0alpha1_FeatureToggles(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureTogglesList":  schema_pkg_apis_featuretoggle_v0alpha1_FeatureTogglesList(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.ResolvedToggleState": schema_pkg_apis_featuretoggle_v0alpha1_ResolvedToggleState(ref),
		"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.ToggleStatus":        schema_pkg_apis_featuretoggle_v0alpha1_ToggleStatus(ref),
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_Feature(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "Feature represents a feature in development and information about that feature It does *not* know the status, only defines properties about the feature itself",
				Type:        []string{"object"},
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Default: map[string]interface{}{},
							Ref:     ref("k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"),
						},
					},
					"spec": {
						SchemaProps: spec.SchemaProps{
							Default: map[string]interface{}{},
							Ref:     ref("github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureSpec"),
						},
					},
				},
			},
		},
		Dependencies: []string{
			"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureSpec", "k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_FeatureList(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Type: []string{"object"},
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Default: map[string]interface{}{},
							Ref:     ref("k8s.io/apimachinery/pkg/apis/meta/v1.ListMeta"),
						},
					},
					"items": {
						SchemaProps: spec.SchemaProps{
							Type: []string{"array"},
							Items: &spec.SchemaOrArray{
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Default: map[string]interface{}{},
										Ref:     ref("github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.Feature"),
									},
								},
							},
						},
					},
				},
			},
		},
		Dependencies: []string{
			"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.Feature", "k8s.io/apimachinery/pkg/apis/meta/v1.ListMeta"},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_FeatureSpec(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Type: []string{"object"},
				Properties: map[string]spec.Schema{
					"description": {
						SchemaProps: spec.SchemaProps{
							Description: "The feature description",
							Default:     "",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"stage": {
						SchemaProps: spec.SchemaProps{
							Description: "Indicates the features level of stability",
							Default:     "",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"codeowner": {
						SchemaProps: spec.SchemaProps{
							Description: "The team who owns this feature development",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"enabledVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "Enabled by default for version >=",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"requiresDevMode": {
						SchemaProps: spec.SchemaProps{
							Description: "Must be run using in development mode (early dev)",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"frontend": {
						SchemaProps: spec.SchemaProps{
							Description: "The flab behavior only effects frontend -- it is not used in the backend",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"requiresRestart": {
						SchemaProps: spec.SchemaProps{
							Description: "The flag is used at startup, so any change requires a restart",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"allowSelfServe": {
						SchemaProps: spec.SchemaProps{
							Description: "Allow cloud users to set the values in UI",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"hideFromAdminPage": {
						SchemaProps: spec.SchemaProps{
							Description: "Do not show the value in the UI",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"hideFromDocs": {
						SchemaProps: spec.SchemaProps{
							Description: "Do not show the value in docs",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
				},
				Required: []string{"description", "stage"},
			},
		},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_FeatureToggles(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "FeatureToggles define the feature state",
				Type:        []string{"object"},
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Default: map[string]interface{}{},
							Ref:     ref("k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"),
						},
					},
					"spec": {
						SchemaProps: spec.SchemaProps{
							Description: "The configured toggles.  Note this may include unknown fields",
							Type:        []string{"object"},
							AdditionalProperties: &spec.SchemaOrBool{
								Allows: true,
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Default: false,
										Type:    []string{"boolean"},
										Format:  "",
									},
								},
							},
						},
					},
				},
				Required: []string{"spec"},
			},
		},
		Dependencies: []string{
			"k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_FeatureTogglesList(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Type: []string{"object"},
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Default: map[string]interface{}{},
							Ref:     ref("k8s.io/apimachinery/pkg/apis/meta/v1.ListMeta"),
						},
					},
					"items": {
						SchemaProps: spec.SchemaProps{
							Type: []string{"array"},
							Items: &spec.SchemaOrArray{
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Default: map[string]interface{}{},
										Ref:     ref("github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureToggles"),
									},
								},
							},
						},
					},
				},
			},
		},
		Dependencies: []string{
			"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.FeatureToggles", "k8s.io/apimachinery/pkg/apis/meta/v1.ListMeta"},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_ResolvedToggleState(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Type: []string{"object"},
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"allowEditing": {
						SchemaProps: spec.SchemaProps{
							Description: "The user is allowed to edit feature toggles on this system",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"restartRequired": {
						SchemaProps: spec.SchemaProps{
							Description: "The system has changes that require still require a restart",
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"enabled": {
						SchemaProps: spec.SchemaProps{
							Description: "The currently enabled flags",
							Type:        []string{"object"},
							AdditionalProperties: &spec.SchemaOrBool{
								Allows: true,
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Default: false,
										Type:    []string{"boolean"},
										Format:  "",
									},
								},
							},
						},
					},
					"toggles": {
						SchemaProps: spec.SchemaProps{
							Description: "Details on the current status",
							Type:        []string{"array"},
							Items: &spec.SchemaOrArray{
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Default: map[string]interface{}{},
										Ref:     ref("github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.ToggleStatus"),
									},
								},
							},
						},
					},
				},
			},
		},
		Dependencies: []string{
			"github.com/grafana/grafana/pkg/apis/featuretoggle/v0alpha1.ToggleStatus"},
	}
}

func schema_pkg_apis_featuretoggle_v0alpha1_ToggleStatus(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Type: []string{"object"},
				Properties: map[string]spec.Schema{
					"name": {
						SchemaProps: spec.SchemaProps{
							Description: "The feature toggle name",
							Default:     "",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"description": {
						SchemaProps: spec.SchemaProps{
							Description: "The flag description",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"stage": {
						SchemaProps: spec.SchemaProps{
							Description: "The feature toggle stage",
							Default:     "",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"enabled": {
						SchemaProps: spec.SchemaProps{
							Description: "Is the flag enabled",
							Default:     false,
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"writeable": {
						SchemaProps: spec.SchemaProps{
							Description: "Can this flag be updated",
							Default:     false,
							Type:        []string{"boolean"},
							Format:      "",
						},
					},
					"source": {
						SchemaProps: spec.SchemaProps{
							Description: "Where was the value configured eg: startup | tenant|org | user | browser missing means default",
							Ref:         ref("github.com/grafana/grafana/pkg/apis/common/v0alpha1.ObjectReference"),
						},
					},
					"warning": {
						SchemaProps: spec.SchemaProps{
							Description: "eg: unknown flag",
							Type:        []string{"string"},
							Format:      "",
						},
					},
				},
				Required: []string{"name", "stage", "enabled", "writeable"},
			},
		},
		Dependencies: []string{
			"github.com/grafana/grafana/pkg/apis/common/v0alpha1.ObjectReference"},
	}
}
