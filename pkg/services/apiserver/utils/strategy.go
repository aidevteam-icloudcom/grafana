package utils

import (
	"context"
	"fmt"
	"time"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation/field"
	"k8s.io/apiserver/pkg/registry/rest"
	"k8s.io/apiserver/pkg/storage"
	"k8s.io/apiserver/pkg/storage/names"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/services/user"

	"github.com/grafana/grafana/pkg/infra/appcontext"
	"github.com/grafana/grafana/pkg/services/auth/identity"
)

type ResourceOptions struct {
	// Check if the requester can write the resource to selected folder
	FolderAccess func(ctx context.Context, user identity.Requester, folder string) bool

	// Check if the requester can write the resource to selected origin
	OriginAccess func(ctx context.Context, user identity.Requester, origin string) bool

	// Check if the value is OK
	ValidationHook backend.ValidateAdmissionFunc

	// Modify the value for admission -- ??? where do we stick warnings???
	MutationHook backend.MutateAdmissionFunc
}

type genericStrategy struct {
	runtime.ObjectTyper
	names.NameGenerator
	opts ResourceOptions
}

// NewGrafanaAppStrategy creates RESTCreateUpdateStrategy that ensures objects are
func NewGrafanaAppStrategy(typer runtime.ObjectTyper, opts ResourceOptions) rest.RESTCreateUpdateStrategy {
	return &genericStrategy{
		ObjectTyper:   typer,
		NameGenerator: names.SimpleNameGenerator,
		opts:          opts,
	}
}

// NamespaceScoped returns true because all Generic resources must be within a namespace.
func (genericStrategy) NamespaceScoped() bool {
	return true
}

type workingValues struct {
	user    identity.Requester
	meta    GrafanaResourceMetaAccessor
	metaold GrafanaResourceMetaAccessor

	// The
	errors field.ErrorList
}

// This processes the annotations making sure the requested user can set the given fields
func (s *genericStrategy) prepare(ctx context.Context, op backend.AdmissionRequestOperation, obj, old runtime.Object) workingValues {
	var err error
	rsp := workingValues{}
	// When validation/mutation hooks exist delegate the functions
	if s.opts.MutationHook != nil {
		gvk := obj.GetObjectKind().GroupVersionKind()
		mrsp, err := s.opts.MutationHook(ctx, &backend.AdmissionRequest{
			PluginContext: backend.PluginContext{}, // TODO?
			Operation:     op,
			Kind: backend.GroupVersionKind{
				Group:   gvk.Group,
				Version: gvk.Version,
				Kind:    gvk.Kind,
			},
			// ObjectBytes: ??,
		})
		if err != nil {
			rsp.errors = append(rsp.errors, &field.Error{
				Type:   field.ErrorTypeInternal,
				Detail: fmt.Sprintf("error calling mutation hook // %s", err),
			})
		} else if mrsp.Allowed {
			if mrsp.ObjectBytes != nil {
				fmt.Printf("TODO... serialize and mutate")
			}
		} else {
			rsp.errors = append(rsp.errors, &field.Error{
				Type:   field.ErrorTypeInternal,
				Detail: fmt.Sprintf("not allowed (TODO... more details) // %+v", mrsp.Result),
			})
		}
	}

	if s.opts.ValidationHook != nil {
		rsp.errors = append(rsp.errors, &field.Error{
			Type:   field.ErrorTypeInternal,
			Detail: "Validation Hooks not yet implemented",
		})
	}

	rsp.user, err = appcontext.User(ctx)
	if err != nil {
		rsp.errors = append(rsp.errors, &field.Error{
			Type:   field.ErrorTypeInternal,
			Detail: fmt.Sprintf("unable to get user for validation // %s", err),
		})
		rsp.user = &user.SignedInUser{} // create a temporary user
	}

	rsp.meta, err = MetaAccessor(obj)
	if err != nil {
		rsp.errors = append(rsp.errors, &field.Error{
			Type:   field.ErrorTypeInternal,
			Detail: fmt.Sprintf("object not meta accessible // %s", err),
		})
	}

	if old != nil {
		rsp.metaold, err = MetaAccessor(old)
		if err != nil {
			rsp.errors = append(rsp.errors, &field.Error{
				Type:   field.ErrorTypeInternal,
				Detail: fmt.Sprintf("old object not meta accessible // %s", err),
			})
		}
	}
	return rsp
}

// This processes the annotations making sure the requested user can set the given fields
// This should be called after any custom logic that may still effect the properties
func (s *genericStrategy) processMetaFields(ctx context.Context, req *workingValues) field.ErrorList {
	// Do not allow people to write object to folders when not supported
	folder := req.meta.GetFolder()
	if folder != "" {
		if s.opts.FolderAccess == nil {
			req.errors = append(req.errors, &field.Error{
				Type:     field.ErrorTypeForbidden,
				Field:    "metadata.annotations#" + AnnoKeyFolder,
				BadValue: folder,
				Detail:   "Folders are not supported for this resource",
			})
		} else if !s.opts.FolderAccess(ctx, req.user, folder) {
			req.errors = append(req.errors, &field.Error{
				Type:     field.ErrorTypeForbidden,
				Field:    "metadata.annotations#" + AnnoKeyFolder,
				BadValue: folder,
				Detail:   "Folders are not supported for this resource",
			})
		}
	}

	// Ensure the origin properties are clean
	origin, err := req.meta.GetOriginInfo()
	if err != nil {
		req.errors = append(req.errors, &field.Error{
			Type:     field.ErrorTypeInternal,
			Field:    "metadata.annotations#" + AnnoKeyFolder,
			BadValue: folder,
			Detail:   err.Error(),
		})
	} else if origin != nil && s.opts.OriginAccess != nil &&
		!s.opts.OriginAccess(ctx, req.user, origin.Name) {
		req.errors = append(req.errors, &field.Error{
			Type:     field.ErrorTypeForbidden,
			Field:    "metadata.annotations#" + AnnoKeyOriginName,
			BadValue: folder,
			Detail:   "Folders are not supported for this resource",
		})
	}
	req.meta.SetOriginInfo(origin) // Writing again will clean up any bad inputs
	return req.errors
}

// Creation setup -- no errors, typically just to remove things that can not be there
func (genericStrategy) PrepareForCreate(ctx context.Context, obj runtime.Object) {
	//fmt.Printf("PrepareForCreate %v\n", obj.GetObjectKind().GroupVersionKind())
}

// Validate on create
func (s *genericStrategy) Validate(ctx context.Context, obj runtime.Object) field.ErrorList {
	work := s.prepare(ctx, backend.AdmissionRequestCreate, obj, nil)

	work.meta.SetCreatedBy(work.user.GetUID().String())
	work.meta.SetUpdatedBy("")
	work.meta.SetUpdatedTimestamp(nil)

	return s.processMetaFields(ctx, &work)
}

// WarningsOnCreate returns warnings for the creation of the given object.
func (s *genericStrategy) WarningsOnCreate(ctx context.Context, obj runtime.Object) []string {
	// fmt.Printf("WarningsOnCreate %v\n", obj.GetObjectKind().GroupVersionKind())
	return nil
}

func (s *genericStrategy) PrepareForUpdate(ctx context.Context, obj, old runtime.Object) {
	// fmt.Printf("PrepareForUpdate %v\n", obj.GetObjectKind().GroupVersionKind())
	// TODO... clear status
}

func (s *genericStrategy) ValidateUpdate(ctx context.Context, obj, old runtime.Object) field.ErrorList {
	if old == nil {
		return s.Validate(ctx, obj) // This is actually a Create -- is this called?
	}
	work := s.prepare(ctx, backend.AdmissionRequestUpdate, obj, old)

	work.meta.SetUpdatedBy(work.user.GetUID().String())
	work.meta.SetUpdatedTimestamp(toPtr(time.Now()))
	work.meta.SetCreatedBy(work.metaold.GetCreatedBy()) // Reset the created by field

	return s.processMetaFields(ctx, &work)
}

// WarningsOnUpdate returns warnings for the given update.
func (genericStrategy) WarningsOnUpdate(ctx context.Context, obj, old runtime.Object) []string {
	// fmt.Printf("WarningsOnUpdate %v\n", obj.GetObjectKind().GroupVersionKind())
	// TODO?  can we stash them in context?
	return nil
}

func (genericStrategy) AllowCreateOnUpdate() bool {
	return true
}

func (genericStrategy) AllowUnconditionalUpdate() bool {
	return true // all an update when `resourceVersion` is not specified
}

func (genericStrategy) Canonicalize(obj runtime.Object) {}

// GetAttrs returns labels and fields of an object.
func GetAttrs(obj runtime.Object) (labels.Set, fields.Set, error) {
	accessor, err := meta.Accessor(obj)
	if err != nil {
		return nil, nil, err
	}
	meta, err := MetaAccessor(obj)
	if err != nil {
		return nil, nil, err
	}
	labels := labels.Set(accessor.GetLabels())
	fields := fields.Set{
		"metadata.name": accessor.GetName(),
	}

	v := meta.GetFolder()
	if v != "" {
		labels[AnnoKeyFolder] = v
	}
	v = meta.GetOriginName()
	if v != "" {
		labels[AnnoKeyOriginName] = v
	}

	return labels, fields, nil
}

// Matcher returns a generic.SelectionPredicate that matches on label and field selectors.
func Matcher(label labels.Selector, field fields.Selector) storage.SelectionPredicate {
	return storage.SelectionPredicate{
		Label:    label,
		Field:    field,
		GetAttrs: GetAttrs,
	}
}

func toPtr[T any](v T) *T {
	return &v
}
