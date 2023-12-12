package entity

import (
	"encoding/json"
	"reflect"
	"time"

	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apiserver/pkg/endpoints/request"

	"github.com/grafana/grafana/pkg/kinds"
	entityStore "github.com/grafana/grafana/pkg/services/store/entity"
)

// this is terrible... but just making it work!!!!
func entityToResource(rsp *entityStore.Entity, res runtime.Object) error {
	var err error

	metaAccessor, err := meta.Accessor(res)
	if err != nil {
		return err
	}

	if len(rsp.Meta) > 0 {
		err = json.Unmarshal(rsp.Meta, res)
		if err != nil {
			return err
		}
	}

	metaAccessor.SetName(rsp.Name)
	metaAccessor.SetNamespace(rsp.Namespace)
	metaAccessor.SetUID(types.UID(rsp.Guid))
	metaAccessor.SetResourceVersion(rsp.Version)
	metaAccessor.SetCreationTimestamp(metav1.Unix(rsp.CreatedAt/1000, rsp.CreatedAt%1000*1000000))

	grafanaAccessor := kinds.MetaAccessor(metaAccessor)

	if rsp.Folder != "" {
		grafanaAccessor.SetFolder(rsp.Folder)
	}
	if rsp.CreatedBy != "" {
		grafanaAccessor.SetCreatedBy(rsp.CreatedBy)
	}
	if rsp.UpdatedBy != "" {
		grafanaAccessor.SetUpdatedBy(rsp.UpdatedBy)
	}
	if rsp.UpdatedAt != 0 {
		updatedAt := time.UnixMilli(rsp.UpdatedAt).UTC()
		grafanaAccessor.SetUpdatedTimestamp(&updatedAt)
	}
	grafanaAccessor.SetSlug(rsp.Slug)
	grafanaAccessor.SetTitle(rsp.Title)

	if rsp.Origin != nil {
		originTime := time.UnixMilli(rsp.Origin.Time).UTC()
		grafanaAccessor.SetOriginInfo(&kinds.ResourceOriginInfo{
			Name: rsp.Origin.Source,
			Key:  rsp.Origin.Key,
			// Path: rsp.Origin.Path,
			Timestamp: &originTime,
		})
	}

	if len(rsp.Labels) > 0 {
		metaAccessor.SetLabels(rsp.Labels)
	}

	// TODO fields?

	if len(rsp.Body) > 0 {
		spec := reflect.ValueOf(res).Elem().FieldByName("Spec")
		if spec != (reflect.Value{}) && spec.CanSet() {
			err = json.Unmarshal(rsp.Body, spec.Addr().Interface())
			if err != nil {
				return err
			}
		}
	}

	if len(rsp.Status) > 0 {
		status := reflect.ValueOf(res).Elem().FieldByName("Status")
		if status != (reflect.Value{}) && status.CanSet() {
			err = json.Unmarshal(rsp.Status, status.Addr().Interface())
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func resourceToEntity(key string, res runtime.Object, requestInfo *request.RequestInfo) (*entityStore.Entity, error) {
	metaAccessor, err := meta.Accessor(res)
	if err != nil {
		return nil, err
	}

	grafanaAccessor := kinds.MetaAccessor(metaAccessor)

	rsp := &entityStore.Entity{
		Group:        requestInfo.APIGroup,
		GroupVersion: requestInfo.APIVersion,
		Resource:     requestInfo.Resource,
		Subresource:  requestInfo.Subresource,
		Namespace:    metaAccessor.GetNamespace(),
		Key:          key,
		Name:         metaAccessor.GetName(),
		Guid:         string(metaAccessor.GetUID()),
		Version:      metaAccessor.GetResourceVersion(),
		Folder:       grafanaAccessor.GetFolder(),
		CreatedAt:    metaAccessor.GetCreationTimestamp().Time.UnixMilli(),
		CreatedBy:    grafanaAccessor.GetCreatedBy(),
		UpdatedBy:    grafanaAccessor.GetUpdatedBy(),
		Slug:         grafanaAccessor.GetSlug(),
		Title:        grafanaAccessor.GetTitle(),
		Origin: &entityStore.EntityOriginInfo{
			Source: grafanaAccessor.GetOriginName(),
			Key:    grafanaAccessor.GetOriginKey(),
			// Path: 	grafanaAccessor.GetOriginPath(),
		},
		Labels: metaAccessor.GetLabels(),
	}

	if t := grafanaAccessor.GetUpdatedTimestamp(); t != nil {
		rsp.UpdatedAt = t.UnixMilli()
	}

	if t := grafanaAccessor.GetOriginTimestamp(); t != nil {
		rsp.Origin.Time = t.UnixMilli()
	}

	rsp.Meta, err = json.Marshal(meta.AsPartialObjectMetadata(metaAccessor))
	if err != nil {
		return nil, err
	}

	// TODO: store entire object in body?
	spec := reflect.ValueOf(res).Elem().FieldByName("Spec")
	if spec != (reflect.Value{}) {
		rsp.Body, err = json.Marshal(spec.Interface())
		if err != nil {
			return nil, err
		}
	}

	status := reflect.ValueOf(res).Elem().FieldByName("Status")
	if status != (reflect.Value{}) {
		rsp.Status, err = json.Marshal(status.Interface())
		if err != nil {
			return nil, err
		}
	}

	return rsp, nil
}
