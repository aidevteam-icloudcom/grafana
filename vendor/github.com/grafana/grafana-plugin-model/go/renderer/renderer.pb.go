// Code generated by protoc-gen-go. DO NOT EDIT.
// source: renderer.proto

package renderer

import proto "github.com/golang/protobuf/proto"
import fmt "fmt"
import math "math"

import (
	context "golang.org/x/net/context"
	grpc "google.golang.org/grpc"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion2 // please upgrade the proto package

type RenderRequest struct {
	Url                  string   `protobuf:"bytes,1,opt,name=url,proto3" json:"url,omitempty"`
	Width                int32    `protobuf:"varint,2,opt,name=width,proto3" json:"width,omitempty"`
	Height               int32    `protobuf:"varint,3,opt,name=height,proto3" json:"height,omitempty"`
	Timeout              int32    `protobuf:"varint,4,opt,name=timeout,proto3" json:"timeout,omitempty"`
	Timezone             string   `protobuf:"bytes,5,opt,name=timezone,proto3" json:"timezone,omitempty"`
	Encoding             string   `protobuf:"bytes,6,opt,name=encoding,proto3" json:"encoding,omitempty"`
	FilePath             string   `protobuf:"bytes,7,opt,name=filePath,proto3" json:"filePath,omitempty"`
	RenderKey            string   `protobuf:"bytes,8,opt,name=renderKey,proto3" json:"renderKey,omitempty"`
	Domain               string   `protobuf:"bytes,9,opt,name=domain,proto3" json:"domain,omitempty"`
	Debug                bool     `protobuf:"varint,10,opt,name=debug,proto3" json:"debug,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *RenderRequest) Reset()         { *m = RenderRequest{} }
func (m *RenderRequest) String() string { return proto.CompactTextString(m) }
func (*RenderRequest) ProtoMessage()    {}
func (*RenderRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_renderer_e28a7c8dd05fc171, []int{0}
}
func (m *RenderRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_RenderRequest.Unmarshal(m, b)
}
func (m *RenderRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_RenderRequest.Marshal(b, m, deterministic)
}
func (dst *RenderRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RenderRequest.Merge(dst, src)
}
func (m *RenderRequest) XXX_Size() int {
	return xxx_messageInfo_RenderRequest.Size(m)
}
func (m *RenderRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_RenderRequest.DiscardUnknown(m)
}

var xxx_messageInfo_RenderRequest proto.InternalMessageInfo

func (m *RenderRequest) GetUrl() string {
	if m != nil {
		return m.Url
	}
	return ""
}

func (m *RenderRequest) GetWidth() int32 {
	if m != nil {
		return m.Width
	}
	return 0
}

func (m *RenderRequest) GetHeight() int32 {
	if m != nil {
		return m.Height
	}
	return 0
}

func (m *RenderRequest) GetTimeout() int32 {
	if m != nil {
		return m.Timeout
	}
	return 0
}

func (m *RenderRequest) GetTimezone() string {
	if m != nil {
		return m.Timezone
	}
	return ""
}

func (m *RenderRequest) GetEncoding() string {
	if m != nil {
		return m.Encoding
	}
	return ""
}

func (m *RenderRequest) GetFilePath() string {
	if m != nil {
		return m.FilePath
	}
	return ""
}

func (m *RenderRequest) GetRenderKey() string {
	if m != nil {
		return m.RenderKey
	}
	return ""
}

func (m *RenderRequest) GetDomain() string {
	if m != nil {
		return m.Domain
	}
	return ""
}

func (m *RenderRequest) GetDebug() bool {
	if m != nil {
		return m.Debug
	}
	return false
}

type RenderResponse struct {
	Error                string   `protobuf:"bytes,1,opt,name=error,proto3" json:"error,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *RenderResponse) Reset()         { *m = RenderResponse{} }
func (m *RenderResponse) String() string { return proto.CompactTextString(m) }
func (*RenderResponse) ProtoMessage()    {}
func (*RenderResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_renderer_e28a7c8dd05fc171, []int{1}
}
func (m *RenderResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_RenderResponse.Unmarshal(m, b)
}
func (m *RenderResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_RenderResponse.Marshal(b, m, deterministic)
}
func (dst *RenderResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RenderResponse.Merge(dst, src)
}
func (m *RenderResponse) XXX_Size() int {
	return xxx_messageInfo_RenderResponse.Size(m)
}
func (m *RenderResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_RenderResponse.DiscardUnknown(m)
}

var xxx_messageInfo_RenderResponse proto.InternalMessageInfo

func (m *RenderResponse) GetError() string {
	if m != nil {
		return m.Error
	}
	return ""
}

func init() {
	proto.RegisterType((*RenderRequest)(nil), "models.RenderRequest")
	proto.RegisterType((*RenderResponse)(nil), "models.RenderResponse")
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// RendererClient is the client API for Renderer service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type RendererClient interface {
	Render(ctx context.Context, in *RenderRequest, opts ...grpc.CallOption) (*RenderResponse, error)
}

type rendererClient struct {
	cc *grpc.ClientConn
}

func NewRendererClient(cc *grpc.ClientConn) RendererClient {
	return &rendererClient{cc}
}

func (c *rendererClient) Render(ctx context.Context, in *RenderRequest, opts ...grpc.CallOption) (*RenderResponse, error) {
	out := new(RenderResponse)
	err := c.cc.Invoke(ctx, "/models.Renderer/Render", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// RendererServer is the server API for Renderer service.
type RendererServer interface {
	Render(context.Context, *RenderRequest) (*RenderResponse, error)
}

func RegisterRendererServer(s *grpc.Server, srv RendererServer) {
	s.RegisterService(&_Renderer_serviceDesc, srv)
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
		FullMethod: "/models.Renderer/Render",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RendererServer).Render(ctx, req.(*RenderRequest))
	}
	return interceptor(ctx, in, info, handler)
}

var _Renderer_serviceDesc = grpc.ServiceDesc{
	ServiceName: "models.Renderer",
	HandlerType: (*RendererServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "Render",
			Handler:    _Renderer_Render_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "renderer.proto",
}

func init() { proto.RegisterFile("renderer.proto", fileDescriptor_renderer_e28a7c8dd05fc171) }

var fileDescriptor_renderer_e28a7c8dd05fc171 = []byte{
	// 265 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0x5c, 0x91, 0xb1, 0x4e, 0xc3, 0x30,
	0x10, 0x86, 0x95, 0x96, 0xa4, 0xce, 0x49, 0x54, 0xc8, 0x82, 0xea, 0x54, 0x31, 0x44, 0x1d, 0x50,
	0xa6, 0x0c, 0x30, 0xb0, 0xc3, 0xc8, 0x82, 0x3c, 0xb2, 0xb5, 0xf8, 0x48, 0x2c, 0x25, 0x76, 0x71,
	0x1c, 0x21, 0x78, 0x03, 0xde, 0x1a, 0xd9, 0x8e, 0x41, 0x74, 0xbb, 0xef, 0x3e, 0xeb, 0xe4, 0xfb,
	0x0f, 0xd6, 0x96, 0xb4, 0x24, 0x4b, 0xb6, 0x39, 0x5a, 0xe3, 0x0c, 0x2f, 0x06, 0x23, 0xa9, 0x1f,
	0x77, 0xdf, 0x0b, 0x38, 0x17, 0x41, 0x09, 0x7a, 0x9f, 0x68, 0x74, 0xfc, 0x02, 0x96, 0x93, 0xed,
	0x31, 0xab, 0xb2, 0xba, 0x14, 0xbe, 0xe4, 0x97, 0x90, 0x7f, 0x28, 0xe9, 0x3a, 0x5c, 0x54, 0x59,
	0x9d, 0x8b, 0x08, 0x7c, 0x03, 0x45, 0x47, 0xaa, 0xed, 0x1c, 0x2e, 0x43, 0x7b, 0x26, 0x8e, 0xb0,
	0x72, 0x6a, 0x20, 0x33, 0x39, 0x3c, 0x0b, 0x22, 0x21, 0xdf, 0x02, 0xf3, 0xe5, 0x97, 0xd1, 0x84,
	0x79, 0x18, 0xff, 0xcb, 0xde, 0x91, 0x7e, 0x35, 0x52, 0xe9, 0x16, 0x8b, 0xe8, 0x12, 0x7b, 0xf7,
	0xa6, 0x7a, 0x7a, 0xde, 0xbb, 0x0e, 0x57, 0xd1, 0x25, 0xe6, 0xd7, 0x50, 0xc6, 0xcd, 0x9e, 0xe8,
	0x13, 0x59, 0x90, 0x7f, 0x0d, 0xff, 0x47, 0x69, 0x86, 0xbd, 0xd2, 0x58, 0x06, 0x35, 0x93, 0xdf,
	0x48, 0xd2, 0x61, 0x6a, 0x11, 0xaa, 0xac, 0x66, 0x22, 0xc2, 0xee, 0x06, 0xd6, 0x29, 0x8a, 0xf1,
	0x68, 0xf4, 0x48, 0xfe, 0x1d, 0x59, 0x6b, 0xec, 0x9c, 0x46, 0x84, 0xdb, 0x47, 0x60, 0x62, 0x4e,
	0x93, 0xdf, 0x43, 0x11, 0x6b, 0x7e, 0xd5, 0xc4, 0x48, 0x9b, 0x7f, 0x71, 0x6e, 0x37, 0xa7, 0xed,
	0x38, 0xfa, 0x01, 0x5e, 0x58, 0x3a, 0xc9, 0xa1, 0x08, 0x37, 0xb9, 0xfb, 0x09, 0x00, 0x00, 0xff,
	0xff, 0x64, 0x1b, 0x1e, 0x63, 0xa5, 0x01, 0x00, 0x00,
}
