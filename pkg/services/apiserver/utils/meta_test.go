package utils_test

import (
	"testing"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"

	"github.com/grafana/grafana/pkg/services/apiserver/utils"
)

type TestResource struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec Spec `json:"spec,omitempty"`
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TestResource) DeepCopyInto(out *TestResource) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Playlist.
func (in *TestResource) DeepCopy() *TestResource {
	if in == nil {
		return nil
	}
	out := new(TestResource)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TestResource) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// Spec defines model for Spec.
type Spec struct {
	// Name of the object.
	Title string `json:"title"`
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Spec) DeepCopyInto(out *Spec) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Spec.
func (in *Spec) DeepCopy() *Spec {
	if in == nil {
		return nil
	}
	out := new(Spec)
	in.DeepCopyInto(out)
	return out
}

type TestResource2 struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec Spec2 `json:"spec,omitempty"`
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TestResource2) DeepCopyInto(out *TestResource2) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Playlist.
func (in *TestResource2) DeepCopy() *TestResource2 {
	if in == nil {
		return nil
	}
	out := new(TestResource2)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TestResource2) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// Spec defines model for Spec.
type Spec2 struct{}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Spec2) DeepCopyInto(out *Spec2) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Spec.
func (in *Spec2) DeepCopy() *Spec2 {
	if in == nil {
		return nil
	}
	out := new(Spec2)
	in.DeepCopyInto(out)
	return out
}

func TestMetaAccessor(t *testing.T) {
	originInfo := &utils.ResourceOriginInfo{
		Name: "test",
		Path: "a/b/c",
		Key:  "kkk",
	}

	t.Run("fails for non resource objects", func(t *testing.T) {
		_, err := utils.MetaAccessor("hello")
		require.Error(t, err)

		_, err = utils.MetaAccessor(unstructured.Unstructured{})
		require.Error(t, err) // Not a pointer!

		_, err = utils.MetaAccessor(&unstructured.Unstructured{})
		require.NoError(t, err) // Must be a pointer

		_, err = utils.MetaAccessor(&TestResource{
			Spec: Spec{
				Title: "HELLO",
			},
		})
		require.NoError(t, err) // Must be a pointer
	})

	t.Run("get and set grafana metadata", func(t *testing.T) {
		res := &unstructured.Unstructured{}
		meta, err := utils.MetaAccessor(res)
		require.NoError(t, err)

		meta.SetOriginInfo(originInfo)
		meta.SetFolder("folderUID")

		require.Equal(t, map[string]string{
			"grafana.app/originName": "test",
			"grafana.app/originPath": "a/b/c",
			"grafana.app/originKey":  "kkk",
			"grafana.app/folder":     "folderUID",
		}, res.GetAnnotations())
	})

	t.Run("find titles", func(t *testing.T) {
		// with a k8s object that has Spec.Title
		obj := &TestResource{
			Spec: Spec{
				Title: "HELLO",
			},
		}

		meta, err := utils.MetaAccessor(obj)
		require.NoError(t, err)
		meta.SetOriginInfo(originInfo)
		meta.SetFolder("folderUID")

		require.Equal(t, map[string]string{
			"grafana.app/originName": "test",
			"grafana.app/originPath": "a/b/c",
			"grafana.app/originKey":  "kkk",
			"grafana.app/folder":     "folderUID",
		}, obj.GetAnnotations())

		require.Equal(t, "HELLO", obj.Spec.Title)
		require.Equal(t, "HELLO", meta.FindTitle(""))
		obj.Spec.Title = ""
		require.Equal(t, "", meta.FindTitle("xxx"))

		// with a k8s object without Spec.Title
		obj2 := &TestResource2{}

		meta, err = utils.MetaAccessor(obj2)
		require.NoError(t, err)
		meta.SetOriginInfo(originInfo)
		meta.SetFolder("folderUID")

		require.Equal(t, map[string]string{
			"grafana.app/originName": "test",
			"grafana.app/originPath": "a/b/c",
			"grafana.app/originKey":  "kkk",
			"grafana.app/folder":     "folderUID",
		}, obj2.GetAnnotations())

		require.Equal(t, "xxx", meta.FindTitle("xxx"))
	})
}
