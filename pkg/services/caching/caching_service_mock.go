// Code generated by mockery v2.14.0. DO NOT EDIT.

package caching

import (
	context "context"

	backend "github.com/grafana/grafana-plugin-sdk-go/backend"

	mock "github.com/stretchr/testify/mock"
)

// FakeOSSCachingService is an autogenerated mock type for the CachingService type
type FakeOSSCachingService struct {
	mock.Mock
}

// CacheResourceResponse provides a mock function with given fields: _a0, _a1, _a2
func (_m *FakeOSSCachingService) CacheResourceResponse(_a0 context.Context, _a1 *backend.CallResourceRequest, _a2 *backend.CallResourceResponse) {
	_m.Called(_a0, _a1, _a2)
}

// HandleQueryRequest provides a mock function with given fields: _a0, _a1
func (_m *FakeOSSCachingService) HandleQueryRequest(_a0 context.Context, _a1 *backend.QueryDataRequest) CachedQueryDataResponse {
	ret := _m.Called(_a0, _a1)

	var r0 CachedQueryDataResponse
	if rf, ok := ret.Get(0).(func(context.Context, *backend.QueryDataRequest) CachedQueryDataResponse); ok {
		r0 = rf(_a0, _a1)
	} else {
		r0 = ret.Get(0).(CachedQueryDataResponse)
	}

	return r0
}

// HandleResourceRequest provides a mock function with given fields: _a0, _a1
func (_m *FakeOSSCachingService) HandleResourceRequest(_a0 context.Context, _a1 *backend.CallResourceRequest) *backend.CallResourceResponse {
	ret := _m.Called(_a0, _a1)

	var r0 *backend.CallResourceResponse
	if rf, ok := ret.Get(0).(func(context.Context, *backend.CallResourceRequest) *backend.CallResourceResponse); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*backend.CallResourceResponse)
		}
	}

	return r0
}

type mockConstructorTestingTNewFakeOSSCachingService interface {
	mock.TestingT
	Cleanup(func())
}

// NewFakeOSSCachingService creates a new instance of FakeOSSCachingService. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
func NewFakeOSSCachingService(t mockConstructorTestingTNewFakeOSSCachingService) *FakeOSSCachingService {
	mock := &FakeOSSCachingService{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
