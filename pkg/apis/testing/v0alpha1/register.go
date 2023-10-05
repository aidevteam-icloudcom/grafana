package v0alpha1

import (
	"fmt"
	"net/http"

	grafanaapiserver "github.com/grafana/grafana/pkg/services/grafana-apiserver"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apiserver/pkg/endpoints/handlers/responsewriters"
	"k8s.io/apiserver/pkg/endpoints/request"
	"k8s.io/apiserver/pkg/registry/generic"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	common "k8s.io/kube-openapi/pkg/common"
	"k8s.io/kube-openapi/pkg/spec3"
)

// GroupName is the group name for this API.
const GroupName = "testing.grafana.com"
const VersionID = "v0alpha1" //
const APIVersion = GroupName + "/" + VersionID

var _ grafanaapiserver.APIGroupBuilder = (*TestingAPIBuilder)(nil)

// This is used just so wire has something unique to return
type TestingAPIBuilder struct {
	codecs serializer.CodecFactory
}

func RegisterAPIService(apiregistration grafanaapiserver.APIRegistrar) *TestingAPIBuilder {
	builder := &TestingAPIBuilder{}
	apiregistration.RegisterAPI(builder)
	return builder
}

func (b *TestingAPIBuilder) GetGroupVersion() schema.GroupVersion {
	return SchemeGroupVersion
}

func (b *TestingAPIBuilder) InstallSchema(scheme *runtime.Scheme) error {
	err := AddToScheme(scheme)
	if err != nil {
		return err
	}
	return scheme.SetVersionPriority(SchemeGroupVersion)
}

func (b *TestingAPIBuilder) GetAPIGroupInfo(
	scheme *runtime.Scheme,
	codecs serializer.CodecFactory, // pointer?
	optsGetter generic.RESTOptionsGetter,
) (*genericapiserver.APIGroupInfo, error) {
	apiGroupInfo := genericapiserver.NewDefaultAPIGroupInfo(GroupName, scheme, metav1.ParameterCodec, codecs)
	storage := map[string]rest.Storage{}
	storage["runtime"] = newDeploymentInfoStorage()
	apiGroupInfo.VersionedResourcesStorageMap[VersionID] = storage
	b.codecs = codecs
	return &apiGroupInfo, nil
}

func (b *TestingAPIBuilder) GetOpenAPIDefinitions() common.GetOpenAPIDefinitions {
	return getOpenAPIDefinitions
}

// Register additional routes with the server
func (b *TestingAPIBuilder) GetAPIRoutes() *grafanaapiserver.APIRoutes {
	return &grafanaapiserver.APIRoutes{
		Root: []grafanaapiserver.APIRouteHandler{
			{
				Path: "/aaa",
				Spec: &spec3.PathProps{
					Summary:     "an example at the root level",
					Description: "longer description here?",
					Get: &spec3.Operation{
						OperationProps: spec3.OperationProps{
							Parameters: []*spec3.Parameter{
								{ParameterProps: spec3.ParameterProps{
									Name: "a",
								}},
							},
						},
					},
				},
				Handler: func(w http.ResponseWriter, r *http.Request) {
					w.Write([]byte("Root level handler (aaa)"))
				},
			},
			{
				Path: "/bbb",
				Spec: &spec3.PathProps{
					Summary:     "an example at the root level",
					Description: "longer description here?",
					Get: &spec3.Operation{
						OperationProps: spec3.OperationProps{
							Parameters: []*spec3.Parameter{
								{ParameterProps: spec3.ParameterProps{
									Name: "b",
								}},
							},
						},
					},
				},
				Handler: func(w http.ResponseWriter, r *http.Request) {
					w.Write([]byte("Root level handler (bbb)"))
				},
			},
		},
		Namespace: []grafanaapiserver.APIRouteHandler{
			{
				Path: "/ccc",
				Spec: &spec3.PathProps{
					Summary:     "an example at the root level",
					Description: "longer description here?",
					Get: &spec3.Operation{
						OperationProps: spec3.OperationProps{
							Parameters: []*spec3.Parameter{
								{ParameterProps: spec3.ParameterProps{
									Name: "a",
								}},
							},
						},
					},
				},
				Handler: func(w http.ResponseWriter, r *http.Request) {
					info, ok := request.RequestInfoFrom(r.Context())
					if !ok {
						responsewriters.ErrorNegotiated(
							apierrors.NewInternalError(fmt.Errorf("no RequestInfo found in the context")),
							b.codecs, schema.GroupVersion{}, w, r,
						)
						return
					}

					w.Write([]byte("Custom namespace route ccc: " + info.Namespace))
				},
			},
		},
	}
}

// SchemeGroupVersion is group version used to register these objects
var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: VersionID}

// Resource takes an unqualified resource and returns a Group qualified GroupResource
func Resource(resource string) schema.GroupResource {
	return SchemeGroupVersion.WithResource(resource).GroupResource()
}

var (
	// SchemeBuilder points to a list of functions added to Scheme.
	SchemeBuilder      = runtime.NewSchemeBuilder(addKnownTypes)
	localSchemeBuilder = &SchemeBuilder
	// AddToScheme is a common registration function for mapping packaged scoped group & version keys to a scheme.
	AddToScheme = localSchemeBuilder.AddToScheme
)

// Adds the list of known types to the given scheme.
func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(SchemeGroupVersion,
		&RuntimeInfo{},
	)
	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}
