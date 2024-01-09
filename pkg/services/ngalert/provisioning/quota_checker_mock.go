// Code generated by mockery v2.34.2. DO NOT EDIT.

package provisioning

import (
	context "context"

	quota "github.com/grafana/grafana/pkg/services/quota"
	mock "github.com/stretchr/testify/mock"
)

// MockQuotaChecker is an autogenerated mock type for the QuotaChecker type
type MockQuotaChecker struct {
	mock.Mock
}

type MockQuotaChecker_Expecter struct {
	mock *mock.Mock
}

func (_m *MockQuotaChecker) EXPECT() *MockQuotaChecker_Expecter {
	return &MockQuotaChecker_Expecter{mock: &_m.Mock}
}

// CheckQuotaReached provides a mock function with given fields: ctx, target, scopeParams
func (_m *MockQuotaChecker) CheckQuotaReached(ctx context.Context, target quota.TargetSrv, scopeParams *quota.ScopeParameters) (bool, error) {
	ret := _m.Called(ctx, target, scopeParams)

	var r0 bool
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, quota.TargetSrv, *quota.ScopeParameters) (bool, error)); ok {
		return rf(ctx, target, scopeParams)
	}
	if rf, ok := ret.Get(0).(func(context.Context, quota.TargetSrv, *quota.ScopeParameters) bool); ok {
		r0 = rf(ctx, target, scopeParams)
	} else {
		r0 = ret.Get(0).(bool)
	}

	if rf, ok := ret.Get(1).(func(context.Context, quota.TargetSrv, *quota.ScopeParameters) error); ok {
		r1 = rf(ctx, target, scopeParams)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// MockQuotaChecker_CheckQuotaReached_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'CheckQuotaReached'
type MockQuotaChecker_CheckQuotaReached_Call struct {
	*mock.Call
}

// CheckQuotaReached is a helper method to define mock.On call
//   - ctx context.Context
//   - target quota.TargetSrv
//   - scopeParams *quota.ScopeParameters
func (_e *MockQuotaChecker_Expecter) CheckQuotaReached(ctx interface{}, target interface{}, scopeParams interface{}) *MockQuotaChecker_CheckQuotaReached_Call {
	return &MockQuotaChecker_CheckQuotaReached_Call{Call: _e.mock.On("CheckQuotaReached", ctx, target, scopeParams)}
}

func (_c *MockQuotaChecker_CheckQuotaReached_Call) Run(run func(ctx context.Context, target quota.TargetSrv, scopeParams *quota.ScopeParameters)) *MockQuotaChecker_CheckQuotaReached_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(quota.TargetSrv), args[2].(*quota.ScopeParameters))
	})
	return _c
}

func (_c *MockQuotaChecker_CheckQuotaReached_Call) Return(_a0 bool, _a1 error) *MockQuotaChecker_CheckQuotaReached_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *MockQuotaChecker_CheckQuotaReached_Call) RunAndReturn(run func(context.Context, quota.TargetSrv, *quota.ScopeParameters) (bool, error)) *MockQuotaChecker_CheckQuotaReached_Call {
	_c.Call.Return(run)
	return _c
}

// NewMockQuotaChecker creates a new instance of MockQuotaChecker. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewMockQuotaChecker(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockQuotaChecker {
	mock := &MockQuotaChecker{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
