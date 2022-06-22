// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.28.0
// 	protoc        v3.19.4
// source: secretsmanager.proto

package secretsmanagerplugin

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type Key struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	OrgId     int64  `protobuf:"varint,1,opt,name=orgId,proto3" json:"orgId,omitempty"`
	Namespace string `protobuf:"bytes,2,opt,name=namespace,proto3" json:"namespace,omitempty"`
	Type      string `protobuf:"bytes,3,opt,name=type,proto3" json:"type,omitempty"`
}

func (x *Key) Reset() {
	*x = Key{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Key) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Key) ProtoMessage() {}

func (x *Key) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Key.ProtoReflect.Descriptor instead.
func (*Key) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{0}
}

func (x *Key) GetOrgId() int64 {
	if x != nil {
		return x.OrgId
	}
	return 0
}

func (x *Key) GetNamespace() string {
	if x != nil {
		return x.Namespace
	}
	return ""
}

func (x *Key) GetType() string {
	if x != nil {
		return x.Type
	}
	return ""
}

type GetSecretRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	KeyDescriptor *Key `protobuf:"bytes,1,opt,name=keyDescriptor,proto3" json:"keyDescriptor,omitempty"`
}

func (x *GetSecretRequest) Reset() {
	*x = GetSecretRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetSecretRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetSecretRequest) ProtoMessage() {}

func (x *GetSecretRequest) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetSecretRequest.ProtoReflect.Descriptor instead.
func (*GetSecretRequest) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{1}
}

func (x *GetSecretRequest) GetKeyDescriptor() *Key {
	if x != nil {
		return x.KeyDescriptor
	}
	return nil
}

type GetSecretResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserFriendlyError string `protobuf:"bytes,1,opt,name=userFriendlyError,proto3" json:"userFriendlyError,omitempty"`
	DecryptedValue    string `protobuf:"bytes,2,opt,name=decryptedValue,proto3" json:"decryptedValue,omitempty"`
	Exists            bool   `protobuf:"varint,3,opt,name=exists,proto3" json:"exists,omitempty"`
}

func (x *GetSecretResponse) Reset() {
	*x = GetSecretResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetSecretResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetSecretResponse) ProtoMessage() {}

func (x *GetSecretResponse) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetSecretResponse.ProtoReflect.Descriptor instead.
func (*GetSecretResponse) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{2}
}

func (x *GetSecretResponse) GetUserFriendlyError() string {
	if x != nil {
		return x.UserFriendlyError
	}
	return ""
}

func (x *GetSecretResponse) GetDecryptedValue() string {
	if x != nil {
		return x.DecryptedValue
	}
	return ""
}

func (x *GetSecretResponse) GetExists() bool {
	if x != nil {
		return x.Exists
	}
	return false
}

type SetSecretRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	KeyDescriptor *Key   `protobuf:"bytes,1,opt,name=keyDescriptor,proto3" json:"keyDescriptor,omitempty"`
	Value         string `protobuf:"bytes,2,opt,name=value,proto3" json:"value,omitempty"`
}

func (x *SetSecretRequest) Reset() {
	*x = SetSecretRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SetSecretRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SetSecretRequest) ProtoMessage() {}

func (x *SetSecretRequest) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SetSecretRequest.ProtoReflect.Descriptor instead.
func (*SetSecretRequest) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{3}
}

func (x *SetSecretRequest) GetKeyDescriptor() *Key {
	if x != nil {
		return x.KeyDescriptor
	}
	return nil
}

func (x *SetSecretRequest) GetValue() string {
	if x != nil {
		return x.Value
	}
	return ""
}

type SetSecretResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserFriendlyError string `protobuf:"bytes,1,opt,name=userFriendlyError,proto3" json:"userFriendlyError,omitempty"`
}

func (x *SetSecretResponse) Reset() {
	*x = SetSecretResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SetSecretResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SetSecretResponse) ProtoMessage() {}

func (x *SetSecretResponse) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SetSecretResponse.ProtoReflect.Descriptor instead.
func (*SetSecretResponse) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{4}
}

func (x *SetSecretResponse) GetUserFriendlyError() string {
	if x != nil {
		return x.UserFriendlyError
	}
	return ""
}

type DeleteSecretRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	KeyDescriptor *Key `protobuf:"bytes,1,opt,name=keyDescriptor,proto3" json:"keyDescriptor,omitempty"`
}

func (x *DeleteSecretRequest) Reset() {
	*x = DeleteSecretRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *DeleteSecretRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeleteSecretRequest) ProtoMessage() {}

func (x *DeleteSecretRequest) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeleteSecretRequest.ProtoReflect.Descriptor instead.
func (*DeleteSecretRequest) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{5}
}

func (x *DeleteSecretRequest) GetKeyDescriptor() *Key {
	if x != nil {
		return x.KeyDescriptor
	}
	return nil
}

type DeleteSecretResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserFriendlyError string `protobuf:"bytes,1,opt,name=userFriendlyError,proto3" json:"userFriendlyError,omitempty"`
}

func (x *DeleteSecretResponse) Reset() {
	*x = DeleteSecretResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *DeleteSecretResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeleteSecretResponse) ProtoMessage() {}

func (x *DeleteSecretResponse) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeleteSecretResponse.ProtoReflect.Descriptor instead.
func (*DeleteSecretResponse) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{6}
}

func (x *DeleteSecretResponse) GetUserFriendlyError() string {
	if x != nil {
		return x.UserFriendlyError
	}
	return ""
}

type ListSecretsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	KeyDescriptor    *Key `protobuf:"bytes,1,opt,name=keyDescriptor,proto3" json:"keyDescriptor,omitempty"`
	AllOrganizations bool `protobuf:"varint,2,opt,name=allOrganizations,proto3" json:"allOrganizations,omitempty"`
}

func (x *ListSecretsRequest) Reset() {
	*x = ListSecretsRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ListSecretsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListSecretsRequest) ProtoMessage() {}

func (x *ListSecretsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListSecretsRequest.ProtoReflect.Descriptor instead.
func (*ListSecretsRequest) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{7}
}

func (x *ListSecretsRequest) GetKeyDescriptor() *Key {
	if x != nil {
		return x.KeyDescriptor
	}
	return nil
}

func (x *ListSecretsRequest) GetAllOrganizations() bool {
	if x != nil {
		return x.AllOrganizations
	}
	return false
}

type ListSecretsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserFriendlyError string `protobuf:"bytes,1,opt,name=userFriendlyError,proto3" json:"userFriendlyError,omitempty"`
	Keys              []*Key `protobuf:"bytes,2,rep,name=keys,proto3" json:"keys,omitempty"`
}

func (x *ListSecretsResponse) Reset() {
	*x = ListSecretsResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ListSecretsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListSecretsResponse) ProtoMessage() {}

func (x *ListSecretsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListSecretsResponse.ProtoReflect.Descriptor instead.
func (*ListSecretsResponse) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{8}
}

func (x *ListSecretsResponse) GetUserFriendlyError() string {
	if x != nil {
		return x.UserFriendlyError
	}
	return ""
}

func (x *ListSecretsResponse) GetKeys() []*Key {
	if x != nil {
		return x.Keys
	}
	return nil
}

type RenameSecretRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	KeyDescriptor *Key   `protobuf:"bytes,1,opt,name=keyDescriptor,proto3" json:"keyDescriptor,omitempty"`
	NewNamespace  string `protobuf:"bytes,2,opt,name=newNamespace,proto3" json:"newNamespace,omitempty"`
}

func (x *RenameSecretRequest) Reset() {
	*x = RenameSecretRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[9]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *RenameSecretRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*RenameSecretRequest) ProtoMessage() {}

func (x *RenameSecretRequest) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[9]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use RenameSecretRequest.ProtoReflect.Descriptor instead.
func (*RenameSecretRequest) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{9}
}

func (x *RenameSecretRequest) GetKeyDescriptor() *Key {
	if x != nil {
		return x.KeyDescriptor
	}
	return nil
}

func (x *RenameSecretRequest) GetNewNamespace() string {
	if x != nil {
		return x.NewNamespace
	}
	return ""
}

type RenameSecretResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserFriendlyError string `protobuf:"bytes,1,opt,name=userFriendlyError,proto3" json:"userFriendlyError,omitempty"`
}

func (x *RenameSecretResponse) Reset() {
	*x = RenameSecretResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_secretsmanager_proto_msgTypes[10]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *RenameSecretResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*RenameSecretResponse) ProtoMessage() {}

func (x *RenameSecretResponse) ProtoReflect() protoreflect.Message {
	mi := &file_secretsmanager_proto_msgTypes[10]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use RenameSecretResponse.ProtoReflect.Descriptor instead.
func (*RenameSecretResponse) Descriptor() ([]byte, []int) {
	return file_secretsmanager_proto_rawDescGZIP(), []int{10}
}

func (x *RenameSecretResponse) GetUserFriendlyError() string {
	if x != nil {
		return x.UserFriendlyError
	}
	return ""
}

var File_secretsmanager_proto protoreflect.FileDescriptor

var file_secretsmanager_proto_rawDesc = []byte{
	0x0a, 0x14, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72,
	0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x14, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d,
	0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x22, 0x4d, 0x0a, 0x03,
	0x4b, 0x65, 0x79, 0x12, 0x14, 0x0a, 0x05, 0x6f, 0x72, 0x67, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x03, 0x52, 0x05, 0x6f, 0x72, 0x67, 0x49, 0x64, 0x12, 0x1c, 0x0a, 0x09, 0x6e, 0x61, 0x6d,
	0x65, 0x73, 0x70, 0x61, 0x63, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x09, 0x6e, 0x61,
	0x6d, 0x65, 0x73, 0x70, 0x61, 0x63, 0x65, 0x12, 0x12, 0x0a, 0x04, 0x74, 0x79, 0x70, 0x65, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x74, 0x79, 0x70, 0x65, 0x22, 0x53, 0x0a, 0x10, 0x47,
	0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12,
	0x3f, 0x0a, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x19, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73,
	0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x65,
	0x79, 0x52, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72,
	0x22, 0x81, 0x01, 0x0a, 0x11, 0x47, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65,
	0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2c, 0x0a, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72,
	0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45,
	0x72, 0x72, 0x6f, 0x72, 0x12, 0x26, 0x0a, 0x0e, 0x64, 0x65, 0x63, 0x72, 0x79, 0x70, 0x74, 0x65,
	0x64, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0e, 0x64, 0x65,
	0x63, 0x72, 0x79, 0x70, 0x74, 0x65, 0x64, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x12, 0x16, 0x0a, 0x06,
	0x65, 0x78, 0x69, 0x73, 0x74, 0x73, 0x18, 0x03, 0x20, 0x01, 0x28, 0x08, 0x52, 0x06, 0x65, 0x78,
	0x69, 0x73, 0x74, 0x73, 0x22, 0x69, 0x0a, 0x10, 0x53, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65,
	0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x3f, 0x0a, 0x0d, 0x6b, 0x65, 0x79, 0x44,
	0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32,
	0x19, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x65, 0x79, 0x52, 0x0d, 0x6b, 0x65, 0x79, 0x44,
	0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x12, 0x14, 0x0a, 0x05, 0x76, 0x61, 0x6c,
	0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x22,
	0x41, 0x0a, 0x11, 0x53, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2c, 0x0a, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65,
	0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72,
	0x6f, 0x72, 0x22, 0x56, 0x0a, 0x13, 0x44, 0x65, 0x6c, 0x65, 0x74, 0x65, 0x53, 0x65, 0x63, 0x72,
	0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x3f, 0x0a, 0x0d, 0x6b, 0x65, 0x79,
	0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b,
	0x32, 0x19, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65,
	0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x65, 0x79, 0x52, 0x0d, 0x6b, 0x65, 0x79,
	0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x22, 0x44, 0x0a, 0x14, 0x44, 0x65,
	0x6c, 0x65, 0x74, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x12, 0x2c, 0x0a, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64,
	0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x11, 0x75,
	0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72,
	0x22, 0x81, 0x01, 0x0a, 0x12, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x3f, 0x0a, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65,
	0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x19,
	0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x65, 0x79, 0x52, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65,
	0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72, 0x12, 0x2a, 0x0a, 0x10, 0x61, 0x6c, 0x6c, 0x4f,
	0x72, 0x67, 0x61, 0x6e, 0x69, 0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x18, 0x02, 0x20, 0x01,
	0x28, 0x08, 0x52, 0x10, 0x61, 0x6c, 0x6c, 0x4f, 0x72, 0x67, 0x61, 0x6e, 0x69, 0x7a, 0x61, 0x74,
	0x69, 0x6f, 0x6e, 0x73, 0x22, 0x72, 0x0a, 0x13, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x63, 0x72,
	0x65, 0x74, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2c, 0x0a, 0x11, 0x75,
	0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65,
	0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x12, 0x2d, 0x0a, 0x04, 0x6b, 0x65, 0x79,
	0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x19, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74,
	0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b,
	0x65, 0x79, 0x52, 0x04, 0x6b, 0x65, 0x79, 0x73, 0x22, 0x7a, 0x0a, 0x13, 0x52, 0x65, 0x6e, 0x61,
	0x6d, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12,
	0x3f, 0x0a, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x19, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73,
	0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x65,
	0x79, 0x52, 0x0d, 0x6b, 0x65, 0x79, 0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x6f, 0x72,
	0x12, 0x22, 0x0a, 0x0c, 0x6e, 0x65, 0x77, 0x4e, 0x61, 0x6d, 0x65, 0x73, 0x70, 0x61, 0x63, 0x65,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x6e, 0x65, 0x77, 0x4e, 0x61, 0x6d, 0x65, 0x73,
	0x70, 0x61, 0x63, 0x65, 0x22, 0x44, 0x0a, 0x14, 0x52, 0x65, 0x6e, 0x61, 0x6d, 0x65, 0x53, 0x65,
	0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2c, 0x0a, 0x11,
	0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69, 0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f,
	0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x11, 0x75, 0x73, 0x65, 0x72, 0x46, 0x72, 0x69,
	0x65, 0x6e, 0x64, 0x6c, 0x79, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x32, 0xfe, 0x03, 0x0a, 0x0e, 0x53,
	0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x4d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x12, 0x5c, 0x0a,
	0x09, 0x47, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x12, 0x26, 0x2e, 0x73, 0x65, 0x63,
	0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69,
	0x6e, 0x2e, 0x47, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65,
	0x73, 0x74, 0x1a, 0x27, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61,
	0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x47, 0x65, 0x74, 0x53, 0x65, 0x63,
	0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x5c, 0x0a, 0x09, 0x53,
	0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x12, 0x26, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65,
	0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e,
	0x53, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x1a, 0x27, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65,
	0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x53, 0x65, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65,
	0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x65, 0x0a, 0x0c, 0x44, 0x65, 0x6c,
	0x65, 0x74, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x12, 0x29, 0x2e, 0x73, 0x65, 0x63, 0x72,
	0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x2e, 0x44, 0x65, 0x6c, 0x65, 0x74, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x1a, 0x2a, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61,
	0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x44, 0x65, 0x6c, 0x65,
	0x74, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x62, 0x0a, 0x0b, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x12,
	0x28, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65,
	0x74, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x29, 0x2e, 0x73, 0x65, 0x63, 0x72,
	0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x2e, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x65, 0x0a, 0x0c, 0x52, 0x65, 0x6e, 0x61, 0x6d, 0x65, 0x53, 0x65,
	0x63, 0x72, 0x65, 0x74, 0x12, 0x29, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61,
	0x6e, 0x61, 0x67, 0x65, 0x72, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x52, 0x65, 0x6e, 0x61,
	0x6d, 0x65, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a,
	0x2a, 0x2e, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x52, 0x65, 0x6e, 0x61, 0x6d, 0x65, 0x53, 0x65, 0x63,
	0x72, 0x65, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x42, 0x19, 0x5a, 0x17, 0x2e,
	0x2f, 0x3b, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x73, 0x6d, 0x61, 0x6e, 0x61, 0x67, 0x65, 0x72,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_secretsmanager_proto_rawDescOnce sync.Once
	file_secretsmanager_proto_rawDescData = file_secretsmanager_proto_rawDesc
)

func file_secretsmanager_proto_rawDescGZIP() []byte {
	file_secretsmanager_proto_rawDescOnce.Do(func() {
		file_secretsmanager_proto_rawDescData = protoimpl.X.CompressGZIP(file_secretsmanager_proto_rawDescData)
	})
	return file_secretsmanager_proto_rawDescData
}

var file_secretsmanager_proto_msgTypes = make([]protoimpl.MessageInfo, 11)
var file_secretsmanager_proto_goTypes = []interface{}{
	(*Key)(nil),                  // 0: secretsmanagerplugin.Key
	(*GetSecretRequest)(nil),     // 1: secretsmanagerplugin.GetSecretRequest
	(*GetSecretResponse)(nil),    // 2: secretsmanagerplugin.GetSecretResponse
	(*SetSecretRequest)(nil),     // 3: secretsmanagerplugin.SetSecretRequest
	(*SetSecretResponse)(nil),    // 4: secretsmanagerplugin.SetSecretResponse
	(*DeleteSecretRequest)(nil),  // 5: secretsmanagerplugin.DeleteSecretRequest
	(*DeleteSecretResponse)(nil), // 6: secretsmanagerplugin.DeleteSecretResponse
	(*ListSecretsRequest)(nil),   // 7: secretsmanagerplugin.ListSecretsRequest
	(*ListSecretsResponse)(nil),  // 8: secretsmanagerplugin.ListSecretsResponse
	(*RenameSecretRequest)(nil),  // 9: secretsmanagerplugin.RenameSecretRequest
	(*RenameSecretResponse)(nil), // 10: secretsmanagerplugin.RenameSecretResponse
}
var file_secretsmanager_proto_depIdxs = []int32{
	0,  // 0: secretsmanagerplugin.GetSecretRequest.keyDescriptor:type_name -> secretsmanagerplugin.Key
	0,  // 1: secretsmanagerplugin.SetSecretRequest.keyDescriptor:type_name -> secretsmanagerplugin.Key
	0,  // 2: secretsmanagerplugin.DeleteSecretRequest.keyDescriptor:type_name -> secretsmanagerplugin.Key
	0,  // 3: secretsmanagerplugin.ListSecretsRequest.keyDescriptor:type_name -> secretsmanagerplugin.Key
	0,  // 4: secretsmanagerplugin.ListSecretsResponse.keys:type_name -> secretsmanagerplugin.Key
	0,  // 5: secretsmanagerplugin.RenameSecretRequest.keyDescriptor:type_name -> secretsmanagerplugin.Key
	1,  // 6: secretsmanagerplugin.SecretsManager.GetSecret:input_type -> secretsmanagerplugin.GetSecretRequest
	3,  // 7: secretsmanagerplugin.SecretsManager.SetSecret:input_type -> secretsmanagerplugin.SetSecretRequest
	5,  // 8: secretsmanagerplugin.SecretsManager.DeleteSecret:input_type -> secretsmanagerplugin.DeleteSecretRequest
	7,  // 9: secretsmanagerplugin.SecretsManager.ListSecrets:input_type -> secretsmanagerplugin.ListSecretsRequest
	9,  // 10: secretsmanagerplugin.SecretsManager.RenameSecret:input_type -> secretsmanagerplugin.RenameSecretRequest
	2,  // 11: secretsmanagerplugin.SecretsManager.GetSecret:output_type -> secretsmanagerplugin.GetSecretResponse
	4,  // 12: secretsmanagerplugin.SecretsManager.SetSecret:output_type -> secretsmanagerplugin.SetSecretResponse
	6,  // 13: secretsmanagerplugin.SecretsManager.DeleteSecret:output_type -> secretsmanagerplugin.DeleteSecretResponse
	8,  // 14: secretsmanagerplugin.SecretsManager.ListSecrets:output_type -> secretsmanagerplugin.ListSecretsResponse
	10, // 15: secretsmanagerplugin.SecretsManager.RenameSecret:output_type -> secretsmanagerplugin.RenameSecretResponse
	11, // [11:16] is the sub-list for method output_type
	6,  // [6:11] is the sub-list for method input_type
	6,  // [6:6] is the sub-list for extension type_name
	6,  // [6:6] is the sub-list for extension extendee
	0,  // [0:6] is the sub-list for field type_name
}

func init() { file_secretsmanager_proto_init() }
func file_secretsmanager_proto_init() {
	if File_secretsmanager_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_secretsmanager_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Key); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetSecretRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetSecretResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SetSecretRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SetSecretResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[5].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*DeleteSecretRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[6].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*DeleteSecretResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[7].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ListSecretsRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[8].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ListSecretsResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[9].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*RenameSecretRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_secretsmanager_proto_msgTypes[10].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*RenameSecretResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_secretsmanager_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   11,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_secretsmanager_proto_goTypes,
		DependencyIndexes: file_secretsmanager_proto_depIdxs,
		MessageInfos:      file_secretsmanager_proto_msgTypes,
	}.Build()
	File_secretsmanager_proto = out.File
	file_secretsmanager_proto_rawDesc = nil
	file_secretsmanager_proto_goTypes = nil
	file_secretsmanager_proto_depIdxs = nil
}
