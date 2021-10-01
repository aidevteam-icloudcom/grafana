// Code generated by MockGen. DO NOT EDIT.
// Source: github.com/grafana/grafana/pkg/services/live/pipeline (interfaces: FrameGetSetter)

// Package pipeline is a generated GoMock package.
package pipeline

import (
	reflect "reflect"

	gomock "github.com/golang/mock/gomock"
	data "github.com/grafana/grafana-plugin-sdk-go/data"
)

// MockFrameGetSetter is a mock of FrameGetSetter interface.
type MockFrameGetSetter struct {
	ctrl     *gomock.Controller
	recorder *MockFrameGetSetterMockRecorder
}

// MockFrameGetSetterMockRecorder is the mock recorder for MockFrameGetSetter.
type MockFrameGetSetterMockRecorder struct {
	mock *MockFrameGetSetter
}

// NewMockFrameGetSetter creates a new mock instance.
func NewMockFrameGetSetter(ctrl *gomock.Controller) *MockFrameGetSetter {
	mock := &MockFrameGetSetter{ctrl: ctrl}
	mock.recorder = &MockFrameGetSetterMockRecorder{mock}
	return mock
}

// EXPECT returns an object that allows the caller to indicate expected use.
func (m *MockFrameGetSetter) EXPECT() *MockFrameGetSetterMockRecorder {
	return m.recorder
}

// Get mocks base method.
func (m *MockFrameGetSetter) Get(arg0 int64, arg1 string) (*data.Frame, bool, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Get", arg0, arg1)
	ret0, _ := ret[0].(*data.Frame)
	ret1, _ := ret[1].(bool)
	ret2, _ := ret[2].(error)
	return ret0, ret1, ret2
}

// Get indicates an expected call of Get.
func (mr *MockFrameGetSetterMockRecorder) Get(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Get", reflect.TypeOf((*MockFrameGetSetter)(nil).Get), arg0, arg1)
}

// Set mocks base method.
func (m *MockFrameGetSetter) Set(arg0 int64, arg1 string, arg2 *data.Frame) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Set", arg0, arg1, arg2)
	ret0, _ := ret[0].(error)
	return ret0
}

// Set indicates an expected call of Set.
func (mr *MockFrameGetSetterMockRecorder) Set(arg0, arg1, arg2 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Set", reflect.TypeOf((*MockFrameGetSetter)(nil).Set), arg0, arg1, arg2)
}
