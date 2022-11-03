// Code generated by MockGen. DO NOT EDIT.
// Source: github.com/grafana/grafana/pkg/services/ngalert/image (interfaces: ImageService)

// Package image is a generated GoMock package.
package image

import (
	context "context"
	reflect "reflect"

	gomock "github.com/golang/mock/gomock"
	models "github.com/grafana/grafana/pkg/services/ngalert/models"
)

// MockImageService is a mock of ImageService interface.
type MockImageService struct {
	ctrl     *gomock.Controller
	recorder *MockImageServiceMockRecorder
}

// MockImageServiceMockRecorder is the mock recorder for MockImageService.
type MockImageServiceMockRecorder struct {
	mock *MockImageService
}

// NewMockImageService creates a new mock instance.
func NewMockImageService(ctrl *gomock.Controller) *MockImageService {
	mock := &MockImageService{ctrl: ctrl}
	mock.recorder = &MockImageServiceMockRecorder{mock}
	return mock
}

// EXPECT returns an object that allows the caller to indicate expected use.
func (m *MockImageService) EXPECT() *MockImageServiceMockRecorder {
	return m.recorder
}

// NewImage mocks base method.
func (m *MockImageService) NewImage(arg0 context.Context, arg1 *models.AlertRule) (*models.Image, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "NewImage", arg0, arg1)
	ret0, _ := ret[0].(*models.Image)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// NewImage indicates an expected call of NewImage.
func (mr *MockImageServiceMockRecorder) NewImage(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "NewImage", reflect.TypeOf((*MockImageService)(nil).NewImage), arg0, arg1)
}
