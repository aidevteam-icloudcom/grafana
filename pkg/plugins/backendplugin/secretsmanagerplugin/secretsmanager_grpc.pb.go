// Code generated by protoc-gen-go-grpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-grpc v1.3.0
// - protoc             v4.25.1
// source: secretsmanager.proto

package secretsmanagerplugin

import (
	context "context"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
// Requires gRPC-Go v1.32.0 or later.
const _ = grpc.SupportPackageIsVersion7

const (
	SecretsManager_GetSecret_FullMethodName     = "/secretsmanagerplugin.SecretsManager/GetSecret"
	SecretsManager_SetSecret_FullMethodName     = "/secretsmanagerplugin.SecretsManager/SetSecret"
	SecretsManager_DeleteSecret_FullMethodName  = "/secretsmanagerplugin.SecretsManager/DeleteSecret"
	SecretsManager_ListSecrets_FullMethodName   = "/secretsmanagerplugin.SecretsManager/ListSecrets"
	SecretsManager_RenameSecret_FullMethodName  = "/secretsmanagerplugin.SecretsManager/RenameSecret"
	SecretsManager_GetAllSecrets_FullMethodName = "/secretsmanagerplugin.SecretsManager/GetAllSecrets"
)

// SecretsManagerClient is the client API for SecretsManager service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type SecretsManagerClient interface {
	GetSecret(ctx context.Context, in *GetSecretRequest, opts ...grpc.CallOption) (*GetSecretResponse, error)
	SetSecret(ctx context.Context, in *SetSecretRequest, opts ...grpc.CallOption) (*SetSecretResponse, error)
	DeleteSecret(ctx context.Context, in *DeleteSecretRequest, opts ...grpc.CallOption) (*DeleteSecretResponse, error)
	ListSecrets(ctx context.Context, in *ListSecretsRequest, opts ...grpc.CallOption) (*ListSecretsResponse, error)
	RenameSecret(ctx context.Context, in *RenameSecretRequest, opts ...grpc.CallOption) (*RenameSecretResponse, error)
	GetAllSecrets(ctx context.Context, in *GetAllSecretsRequest, opts ...grpc.CallOption) (*GetAllSecretsResponse, error)
}

type secretsManagerClient struct {
	cc grpc.ClientConnInterface
}

func NewSecretsManagerClient(cc grpc.ClientConnInterface) SecretsManagerClient {
	return &secretsManagerClient{cc}
}

func (c *secretsManagerClient) GetSecret(ctx context.Context, in *GetSecretRequest, opts ...grpc.CallOption) (*GetSecretResponse, error) {
	out := new(GetSecretResponse)
	err := c.cc.Invoke(ctx, SecretsManager_GetSecret_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *secretsManagerClient) SetSecret(ctx context.Context, in *SetSecretRequest, opts ...grpc.CallOption) (*SetSecretResponse, error) {
	out := new(SetSecretResponse)
	err := c.cc.Invoke(ctx, SecretsManager_SetSecret_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *secretsManagerClient) DeleteSecret(ctx context.Context, in *DeleteSecretRequest, opts ...grpc.CallOption) (*DeleteSecretResponse, error) {
	out := new(DeleteSecretResponse)
	err := c.cc.Invoke(ctx, SecretsManager_DeleteSecret_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *secretsManagerClient) ListSecrets(ctx context.Context, in *ListSecretsRequest, opts ...grpc.CallOption) (*ListSecretsResponse, error) {
	out := new(ListSecretsResponse)
	err := c.cc.Invoke(ctx, SecretsManager_ListSecrets_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *secretsManagerClient) RenameSecret(ctx context.Context, in *RenameSecretRequest, opts ...grpc.CallOption) (*RenameSecretResponse, error) {
	out := new(RenameSecretResponse)
	err := c.cc.Invoke(ctx, SecretsManager_RenameSecret_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *secretsManagerClient) GetAllSecrets(ctx context.Context, in *GetAllSecretsRequest, opts ...grpc.CallOption) (*GetAllSecretsResponse, error) {
	out := new(GetAllSecretsResponse)
	err := c.cc.Invoke(ctx, SecretsManager_GetAllSecrets_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// SecretsManagerServer is the server API for SecretsManager service.
// All implementations must embed UnimplementedSecretsManagerServer
// for forward compatibility
type SecretsManagerServer interface {
	GetSecret(context.Context, *GetSecretRequest) (*GetSecretResponse, error)
	SetSecret(context.Context, *SetSecretRequest) (*SetSecretResponse, error)
	DeleteSecret(context.Context, *DeleteSecretRequest) (*DeleteSecretResponse, error)
	ListSecrets(context.Context, *ListSecretsRequest) (*ListSecretsResponse, error)
	RenameSecret(context.Context, *RenameSecretRequest) (*RenameSecretResponse, error)
	GetAllSecrets(context.Context, *GetAllSecretsRequest) (*GetAllSecretsResponse, error)
	mustEmbedUnimplementedSecretsManagerServer()
}

// UnimplementedSecretsManagerServer must be embedded to have forward compatible implementations.
type UnimplementedSecretsManagerServer struct {
}

func (UnimplementedSecretsManagerServer) GetSecret(context.Context, *GetSecretRequest) (*GetSecretResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetSecret not implemented")
}
func (UnimplementedSecretsManagerServer) SetSecret(context.Context, *SetSecretRequest) (*SetSecretResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method SetSecret not implemented")
}
func (UnimplementedSecretsManagerServer) DeleteSecret(context.Context, *DeleteSecretRequest) (*DeleteSecretResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method DeleteSecret not implemented")
}
func (UnimplementedSecretsManagerServer) ListSecrets(context.Context, *ListSecretsRequest) (*ListSecretsResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ListSecrets not implemented")
}
func (UnimplementedSecretsManagerServer) RenameSecret(context.Context, *RenameSecretRequest) (*RenameSecretResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method RenameSecret not implemented")
}
func (UnimplementedSecretsManagerServer) GetAllSecrets(context.Context, *GetAllSecretsRequest) (*GetAllSecretsResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetAllSecrets not implemented")
}
func (UnimplementedSecretsManagerServer) mustEmbedUnimplementedSecretsManagerServer() {}

// UnsafeSecretsManagerServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to SecretsManagerServer will
// result in compilation errors.
type UnsafeSecretsManagerServer interface {
	mustEmbedUnimplementedSecretsManagerServer()
}

func RegisterSecretsManagerServer(s grpc.ServiceRegistrar, srv SecretsManagerServer) {
	s.RegisterService(&SecretsManager_ServiceDesc, srv)
}

func _SecretsManager_GetSecret_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetSecretRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).GetSecret(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_GetSecret_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).GetSecret(ctx, req.(*GetSecretRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SecretsManager_SetSecret_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SetSecretRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).SetSecret(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_SetSecret_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).SetSecret(ctx, req.(*SetSecretRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SecretsManager_DeleteSecret_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteSecretRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).DeleteSecret(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_DeleteSecret_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).DeleteSecret(ctx, req.(*DeleteSecretRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SecretsManager_ListSecrets_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ListSecretsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).ListSecrets(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_ListSecrets_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).ListSecrets(ctx, req.(*ListSecretsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SecretsManager_RenameSecret_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RenameSecretRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).RenameSecret(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_RenameSecret_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).RenameSecret(ctx, req.(*RenameSecretRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SecretsManager_GetAllSecrets_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetAllSecretsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SecretsManagerServer).GetAllSecrets(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: SecretsManager_GetAllSecrets_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SecretsManagerServer).GetAllSecrets(ctx, req.(*GetAllSecretsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// SecretsManager_ServiceDesc is the grpc.ServiceDesc for SecretsManager service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var SecretsManager_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "secretsmanagerplugin.SecretsManager",
	HandlerType: (*SecretsManagerServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "GetSecret",
			Handler:    _SecretsManager_GetSecret_Handler,
		},
		{
			MethodName: "SetSecret",
			Handler:    _SecretsManager_SetSecret_Handler,
		},
		{
			MethodName: "DeleteSecret",
			Handler:    _SecretsManager_DeleteSecret_Handler,
		},
		{
			MethodName: "ListSecrets",
			Handler:    _SecretsManager_ListSecrets_Handler,
		},
		{
			MethodName: "RenameSecret",
			Handler:    _SecretsManager_RenameSecret_Handler,
		},
		{
			MethodName: "GetAllSecrets",
			Handler:    _SecretsManager_GetAllSecrets_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "secretsmanager.proto",
}
