// SPDX-License-Identifier: AGPL-3.0-only

// Code generated by client-gen. DO NOT EDIT.

package v0alpha1

import (
	"context"
	json "encoding/json"
	"fmt"
	"time"

	v0alpha1 "github.com/grafana/grafana/pkg/apis/service/v0alpha1"
	servicev0alpha1 "github.com/grafana/grafana/pkg/generated/applyconfiguration/service/v0alpha1"
	scheme "github.com/grafana/grafana/pkg/generated/clientset/clientset/scheme"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	types "k8s.io/apimachinery/pkg/types"
	watch "k8s.io/apimachinery/pkg/watch"
	rest "k8s.io/client-go/rest"
)

// ExternalNamesGetter has a method to return a ExternalNameInterface.
// A group's client should implement this interface.
type ExternalNamesGetter interface {
	ExternalNames(namespace string) ExternalNameInterface
}

// ExternalNameInterface has methods to work with ExternalName resources.
type ExternalNameInterface interface {
	Create(ctx context.Context, externalName *v0alpha1.ExternalName, opts v1.CreateOptions) (*v0alpha1.ExternalName, error)
	Update(ctx context.Context, externalName *v0alpha1.ExternalName, opts v1.UpdateOptions) (*v0alpha1.ExternalName, error)
	Delete(ctx context.Context, name string, opts v1.DeleteOptions) error
	DeleteCollection(ctx context.Context, opts v1.DeleteOptions, listOpts v1.ListOptions) error
	Get(ctx context.Context, name string, opts v1.GetOptions) (*v0alpha1.ExternalName, error)
	List(ctx context.Context, opts v1.ListOptions) (*v0alpha1.ExternalNameList, error)
	Watch(ctx context.Context, opts v1.ListOptions) (watch.Interface, error)
	Patch(ctx context.Context, name string, pt types.PatchType, data []byte, opts v1.PatchOptions, subresources ...string) (result *v0alpha1.ExternalName, err error)
	Apply(ctx context.Context, externalName *servicev0alpha1.ExternalNameApplyConfiguration, opts v1.ApplyOptions) (result *v0alpha1.ExternalName, err error)
	ExternalNameExpansion
}

// externalNames implements ExternalNameInterface
type externalNames struct {
	client rest.Interface
	ns     string
}

// newExternalNames returns a ExternalNames
func newExternalNames(c *ServiceV0alpha1Client, namespace string) *externalNames {
	return &externalNames{
		client: c.RESTClient(),
		ns:     namespace,
	}
}

// Get takes name of the externalName, and returns the corresponding externalName object, and an error if there is any.
func (c *externalNames) Get(ctx context.Context, name string, options v1.GetOptions) (result *v0alpha1.ExternalName, err error) {
	result = &v0alpha1.ExternalName{}
	err = c.client.Get().
		Namespace(c.ns).
		Resource("externalnames").
		Name(name).
		VersionedParams(&options, scheme.ParameterCodec).
		Do(ctx).
		Into(result)
	return
}

// List takes label and field selectors, and returns the list of ExternalNames that match those selectors.
func (c *externalNames) List(ctx context.Context, opts v1.ListOptions) (result *v0alpha1.ExternalNameList, err error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	result = &v0alpha1.ExternalNameList{}
	err = c.client.Get().
		Namespace(c.ns).
		Resource("externalnames").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		Do(ctx).
		Into(result)
	return
}

// Watch returns a watch.Interface that watches the requested externalNames.
func (c *externalNames) Watch(ctx context.Context, opts v1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true
	return c.client.Get().
		Namespace(c.ns).
		Resource("externalnames").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		Watch(ctx)
}

// Create takes the representation of a externalName and creates it.  Returns the server's representation of the externalName, and an error, if there is any.
func (c *externalNames) Create(ctx context.Context, externalName *v0alpha1.ExternalName, opts v1.CreateOptions) (result *v0alpha1.ExternalName, err error) {
	result = &v0alpha1.ExternalName{}
	err = c.client.Post().
		Namespace(c.ns).
		Resource("externalnames").
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(externalName).
		Do(ctx).
		Into(result)
	return
}

// Update takes the representation of a externalName and updates it. Returns the server's representation of the externalName, and an error, if there is any.
func (c *externalNames) Update(ctx context.Context, externalName *v0alpha1.ExternalName, opts v1.UpdateOptions) (result *v0alpha1.ExternalName, err error) {
	result = &v0alpha1.ExternalName{}
	err = c.client.Put().
		Namespace(c.ns).
		Resource("externalnames").
		Name(externalName.Name).
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(externalName).
		Do(ctx).
		Into(result)
	return
}

// Delete takes name of the externalName and deletes it. Returns an error if one occurs.
func (c *externalNames) Delete(ctx context.Context, name string, opts v1.DeleteOptions) error {
	return c.client.Delete().
		Namespace(c.ns).
		Resource("externalnames").
		Name(name).
		Body(&opts).
		Do(ctx).
		Error()
}

// DeleteCollection deletes a collection of objects.
func (c *externalNames) DeleteCollection(ctx context.Context, opts v1.DeleteOptions, listOpts v1.ListOptions) error {
	var timeout time.Duration
	if listOpts.TimeoutSeconds != nil {
		timeout = time.Duration(*listOpts.TimeoutSeconds) * time.Second
	}
	return c.client.Delete().
		Namespace(c.ns).
		Resource("externalnames").
		VersionedParams(&listOpts, scheme.ParameterCodec).
		Timeout(timeout).
		Body(&opts).
		Do(ctx).
		Error()
}

// Patch applies the patch and returns the patched externalName.
func (c *externalNames) Patch(ctx context.Context, name string, pt types.PatchType, data []byte, opts v1.PatchOptions, subresources ...string) (result *v0alpha1.ExternalName, err error) {
	result = &v0alpha1.ExternalName{}
	err = c.client.Patch(pt).
		Namespace(c.ns).
		Resource("externalnames").
		Name(name).
		SubResource(subresources...).
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(data).
		Do(ctx).
		Into(result)
	return
}

// Apply takes the given apply declarative configuration, applies it and returns the applied externalName.
func (c *externalNames) Apply(ctx context.Context, externalName *servicev0alpha1.ExternalNameApplyConfiguration, opts v1.ApplyOptions) (result *v0alpha1.ExternalName, err error) {
	if externalName == nil {
		return nil, fmt.Errorf("externalName provided to Apply must not be nil")
	}
	patchOpts := opts.ToPatchOptions()
	data, err := json.Marshal(externalName)
	if err != nil {
		return nil, err
	}
	name := externalName.Name
	if name == nil {
		return nil, fmt.Errorf("externalName.Name must be provided to Apply")
	}
	result = &v0alpha1.ExternalName{}
	err = c.client.Patch(types.ApplyPatchType).
		Namespace(c.ns).
		Resource("externalnames").
		Name(*name).
		VersionedParams(&patchOpts, scheme.ParameterCodec).
		Body(data).
		Do(ctx).
		Into(result)
	return
}
