// Code generated by protoc-gen-go-grpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-grpc v1.3.0
// - protoc             (unknown)
// source: rendererv2.proto

package pluginextensionv2

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
	Renderer_Render_FullMethodName    = "/pluginextensionv2.Renderer/Render"
	Renderer_RenderCSV_FullMethodName = "/pluginextensionv2.Renderer/RenderCSV"
)

// RendererClient is the client API for Renderer service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type RendererClient interface {
	Render(ctx context.Context, in *RenderRequest, opts ...grpc.CallOption) (*RenderResponse, error)
	RenderCSV(ctx context.Context, in *RenderCSVRequest, opts ...grpc.CallOption) (*RenderCSVResponse, error)
}

type rendererClient struct {
	cc grpc.ClientConnInterface
}

func NewRendererClient(cc grpc.ClientConnInterface) RendererClient {
	return &rendererClient{cc}
}

func (c *rendererClient) Render(ctx context.Context, in *RenderRequest, opts ...grpc.CallOption) (*RenderResponse, error) {
	out := new(RenderResponse)
	err := c.cc.Invoke(ctx, Renderer_Render_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *rendererClient) RenderCSV(ctx context.Context, in *RenderCSVRequest, opts ...grpc.CallOption) (*RenderCSVResponse, error) {
	out := new(RenderCSVResponse)
	err := c.cc.Invoke(ctx, Renderer_RenderCSV_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// RendererServer is the server API for Renderer service.
// All implementations should embed UnimplementedRendererServer
// for forward compatibility
type RendererServer interface {
	Render(context.Context, *RenderRequest) (*RenderResponse, error)
	RenderCSV(context.Context, *RenderCSVRequest) (*RenderCSVResponse, error)
}

// UnimplementedRendererServer should be embedded to have forward compatible implementations.
type UnimplementedRendererServer struct {
}

func (UnimplementedRendererServer) Render(context.Context, *RenderRequest) (*RenderResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method Render not implemented")
}
func (UnimplementedRendererServer) RenderCSV(context.Context, *RenderCSVRequest) (*RenderCSVResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method RenderCSV not implemented")
}

// UnsafeRendererServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to RendererServer will
// result in compilation errors.
type UnsafeRendererServer interface {
	mustEmbedUnimplementedRendererServer()
}

func RegisterRendererServer(s grpc.ServiceRegistrar, srv RendererServer) {
	s.RegisterService(&Renderer_ServiceDesc, srv)
}

func _Renderer_Render_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RenderRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RendererServer).Render(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: Renderer_Render_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RendererServer).Render(ctx, req.(*RenderRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _Renderer_RenderCSV_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RenderCSVRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RendererServer).RenderCSV(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: Renderer_RenderCSV_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RendererServer).RenderCSV(ctx, req.(*RenderCSVRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// Renderer_ServiceDesc is the grpc.ServiceDesc for Renderer service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var Renderer_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "pluginextensionv2.Renderer",
	HandlerType: (*RendererServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "Render",
			Handler:    _Renderer_Render_Handler,
		},
		{
			MethodName: "RenderCSV",
			Handler:    _Renderer_RenderCSV_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "rendererv2.proto",
}
