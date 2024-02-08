//go:build !ignore_autogenerated
// +build !ignore_autogenerated

// SPDX-License-Identifier: AGPL-3.0-only

// Code generated by deepcopy-gen. DO NOT EDIT.

package v0alpha1

import (
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
		*out = make([]TemplateVariable, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	if in.Targets != nil {
		in, out := &in.Targets, &out.Targets
		*out = make([]Target, len(*in))
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
func (in *RenderedQuery) DeepCopyInto(out *RenderedQuery) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	if in.Targets != nil {
		in, out := &in.Targets, &out.Targets
		*out = make([]Target, len(*in))
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

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Target) DeepCopyInto(out *Target) {
	*out = *in
	if in.Variables != nil {
		in, out := &in.Variables, &out.Variables
		*out = make(map[string][]VariableReplacement, len(*in))
		for key, val := range *in {
			var outVal []VariableReplacement
			if val == nil {
				(*out)[key] = nil
			} else {
				in, out := &val, &outVal
				*out = make([]VariableReplacement, len(*in))
				for i := range *in {
					(*in)[i].DeepCopyInto(&(*out)[i])
				}
			}
			(*out)[key] = outVal
		}
	}
	in.Properties.DeepCopyInto(&out.Properties)
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Target.
func (in *Target) DeepCopy() *Target {
	if in == nil {
		return nil
	}
	out := new(Target)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateVariable) DeepCopyInto(out *TemplateVariable) {
	*out = *in
	if in.DefaultValues != nil {
		in, out := &in.DefaultValues, &out.DefaultValues
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	in.ValueListDefinition.DeepCopyInto(&out.ValueListDefinition)
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateVariable.
func (in *TemplateVariable) DeepCopy() *TemplateVariable {
	if in == nil {
		return nil
	}
	out := new(TemplateVariable)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *VariableReplacement) DeepCopyInto(out *VariableReplacement) {
	*out = *in
	if in.Position != nil {
		in, out := &in.Position, &out.Position
		*out = new(Position)
		**out = **in
	}
	return
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new VariableReplacement.
func (in *VariableReplacement) DeepCopy() *VariableReplacement {
	if in == nil {
		return nil
	}
	out := new(VariableReplacement)
	in.DeepCopyInto(out)
	return out
}
