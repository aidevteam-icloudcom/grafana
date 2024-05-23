// Code generated by mockery v2.34.0. DO NOT EDIT.

package dashboardsnapshots

import (
	context "context"

	mock "github.com/stretchr/testify/mock"
)

// MockService is an autogenerated mock type for the Service type
type MockService struct {
	mock.Mock
}

// CreateDashboardSnapshot provides a mock function with given fields: _a0, _a1
func (_m *MockService) CreateDashboardSnapshot(_a0 context.Context, _a1 *CreateDashboardSnapshotCommand) (*DashboardSnapshot, error) {
	ret := _m.Called(_a0, _a1)

	var r0 *DashboardSnapshot
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *CreateDashboardSnapshotCommand) (*DashboardSnapshot, error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *CreateDashboardSnapshotCommand) *DashboardSnapshot); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*DashboardSnapshot)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *CreateDashboardSnapshotCommand) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// DeleteDashboardSnapshot provides a mock function with given fields: _a0, _a1
func (_m *MockService) DeleteDashboardSnapshot(_a0 context.Context, _a1 *DeleteDashboardSnapshotCommand) error {
	ret := _m.Called(_a0, _a1)

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, *DeleteDashboardSnapshotCommand) error); ok {
		r0 = rf(_a0, _a1)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// DeleteExpiredSnapshots provides a mock function with given fields: _a0, _a1
func (_m *MockService) DeleteExpiredSnapshots(_a0 context.Context, _a1 *DeleteExpiredSnapshotsCommand) error {
	ret := _m.Called(_a0, _a1)

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, *DeleteExpiredSnapshotsCommand) error); ok {
		r0 = rf(_a0, _a1)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// GetDashboardSnapshot provides a mock function with given fields: _a0, _a1
func (_m *MockService) GetDashboardSnapshot(_a0 context.Context, _a1 *GetDashboardSnapshotQuery) (*DashboardSnapshot, error) {
	ret := _m.Called(_a0, _a1)

	var r0 *DashboardSnapshot
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *GetDashboardSnapshotQuery) (*DashboardSnapshot, error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *GetDashboardSnapshotQuery) *DashboardSnapshot); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*DashboardSnapshot)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *GetDashboardSnapshotQuery) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// SearchDashboardSnapshots provides a mock function with given fields: _a0, _a1
func (_m *MockService) SearchDashboardSnapshots(_a0 context.Context, _a1 *GetDashboardSnapshotsQuery) (DashboardSnapshotsList, error) {
	ret := _m.Called(_a0, _a1)

	var r0 DashboardSnapshotsList
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *GetDashboardSnapshotsQuery) (DashboardSnapshotsList, error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *GetDashboardSnapshotsQuery) DashboardSnapshotsList); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(DashboardSnapshotsList)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *GetDashboardSnapshotsQuery) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// ValidateDashboardExists provides a mock function with given fields: _a0, _a1, _a2
func (_m *MockService) ValidateDashboardExists(_a0 context.Context, _a1 int64, _a2 string) error {
	ret := _m.Called(_a0, _a1, _a2)

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, int64, string) error); ok {
		r0 = rf(_a0, _a1, _a2)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// NewMockService creates a new instance of MockService. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewMockService(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockService {
	mock := &MockService{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
