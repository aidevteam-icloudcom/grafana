//go:build !ignore_autogenerated
// +build !ignore_autogenerated

// SPDX-License-Identifier: AGPL-3.0-only

// Code generated by deepcopy-gen. DO NOT EDIT.

package v0alpha1

import (
	commonv0alpha1 "github.com/grafana/grafana/pkg/apis/common/v0alpha1"
	runtime "k8s.io/apimachinery/pkg/runtime"
)

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Position) DeepCopyInto(out *Position) {
	*out = *in
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Position.
func (in *Position) DeepCopy() *Position {
	if in == nil {
		return nil
	}
	out := new(Position)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *QueryTemplate) DeepCopyInto(out *QueryTemplate) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new QueryTemplate.
func (in *QueryTemplate) DeepCopy() *QueryTemplate {
	if in == nil {
		return nil
	}
	out := new(QueryTemplate)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *QueryTemplate) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *QueryTemplateList) DeepCopyInto(out *QueryTemplateList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]QueryTemplate, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new QueryTemplateList.
func (in *QueryTemplateList) DeepCopy() *QueryTemplateList {
	if in == nil {
		return nil
	}
	out := new(QueryTemplateList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *QueryTemplateList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *QueryTemplateSpec) DeepCopyInto(out *QueryTemplateSpec) {
	*out = *in
	if in.Variables != nil {
		in, out := &in.Variables, &out.Variables
		*out = make([]QueryVariable, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	if in.Targets != nil {
		in, out := &in.Targets, &out.Targets
		*out = make([]commonv0alpha1.Unstructured, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new QueryTemplateSpec.
func (in *QueryTemplateSpec) DeepCopy() *QueryTemplateSpec {
	if in == nil {
		return nil
	}
	out := new(QueryTemplateSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *QueryVariable) DeepCopyInto(out *QueryVariable) {
	*out = *in
	if in.Positions != nil {
		in, out := &in.Positions, &out.Positions
		*out = make([]Position, len(*in))
		copy(*out, *in)
	}
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new QueryVariable.
func (in *QueryVariable) DeepCopy() *QueryVariable {
	if in == nil {
		return nil
	}
	out := new(QueryVariable)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *RenderedQuery) DeepCopyInto(out *RenderedQuery) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	if in.Targets != nil {
		in, out := &in.Targets, &out.Targets
		*out = make([]commonv0alpha1.Unstructured, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new RenderedQuery.
func (in *RenderedQuery) DeepCopy() *RenderedQuery {
	if in == nil {
		return nil
	}
	out := new(RenderedQuery)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *RenderedQuery) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}
