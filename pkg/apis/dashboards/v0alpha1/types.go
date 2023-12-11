package v0alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	runtime "k8s.io/apimachinery/pkg/runtime"

	"github.com/grafana/grafana/pkg/apis"
	"github.com/grafana/grafana/pkg/components/simplejson"
)

const (
	GROUP      = "dashboards.grafana.app"
	VERSION    = "v0alpha1"
	APIVERSION = GROUP + "/" + VERSION
)

var DashboardResourceInfo = apis.NewResourceInfo(GROUP, VERSION,
	"dashboards", "dashboard", "Dashboard",
	func() runtime.Object { return &Dashboard{} },
	func() runtime.Object { return &DashboardList{} },
)

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type Dashboard struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// The dashboard body
	Spec DashboardBody `json:"spec,omitempty"`
}

// TODO: more defined schema/object
type DashboardBody = *simplejson.Json

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type DashboardList struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Dashboard `json:"items,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type DashboardVersionsInfo struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []DashboardVersionInfo `json:"items,omitempty"`
}

type DashboardVersionInfo struct {
	Version       int    `json:"version"`
	ParentVersion int    `json:"parentVersion,omitempty"`
	Created       int64  `json:"created"`
	Message       string `json:"message,omitempty"`
	CreatedBy     string `json:"createdBy,omitempty"`
}

// +k8s:conversion-gen:explicit-from=net/url.Values
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type VersionsQueryOptions struct {
	metav1.TypeMeta `json:",inline"`

	// Path is the URL path
	// +optional
	Path string `json:"path,omitempty"`

	// +optional
	Version int64 `json:"version,omitempty"`
}

// Information about how the requesting user can use a given dashboard
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type DashboardAccessInfo struct {
	metav1.TypeMeta `json:",inline"`

	CanSave                bool                  `json:"canSave"`
	CanEdit                bool                  `json:"canEdit"`
	CanAdmin               bool                  `json:"canAdmin"`
	CanStar                bool                  `json:"canStar"`
	CanDelete              bool                  `json:"canDelete"`
	AnnotationsPermissions *AnnotationPermission `json:"annotationsPermissions"`
}

type AnnotationPermission struct {
	Dashboard    AnnotationActions `json:"dashboard"`
	Organization AnnotationActions `json:"organization"`
}

type AnnotationActions struct {
	CanAdd    bool `json:"canAdd"`
	CanEdit   bool `json:"canEdit"`
	CanDelete bool `json:"canDelete"`
}
