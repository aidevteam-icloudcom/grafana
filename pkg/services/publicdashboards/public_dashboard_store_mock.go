// Code generated by mockery v2.12.1. DO NOT EDIT.

package publicdashboards

import (
	context "context"

	models "github.com/grafana/grafana/pkg/models"
	mock "github.com/stretchr/testify/mock"

	publicdashboardsmodels "github.com/grafana/grafana/pkg/services/publicdashboards/models"

	testing "testing"
)

// FakePublicDashboardStore is an autogenerated mock type for the Store type
type FakePublicDashboardStore struct {
	mock.Mock
}

// AccessTokenExists provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) AccessTokenExists(ctx context.Context, accessToken string) (bool, error) {
	ret := _m.Called(ctx, accessToken)

	var r0 bool
	if rf, ok := ret.Get(0).(func(context.Context, string) bool); ok {
		r0 = rf(ctx, accessToken)
	} else {
		r0 = ret.Get(0).(bool)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, accessToken)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GenerateNewPublicDashboardAccessToken provides a mock function with given fields: ctx
func (_m *FakePublicDashboardStore) GenerateNewPublicDashboardAccessToken(ctx context.Context) (string, error) {
	ret := _m.Called(ctx)

	var r0 string
	if rf, ok := ret.Get(0).(func(context.Context) string); ok {
		r0 = rf(ctx)
	} else {
		r0 = ret.Get(0).(string)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context) error); ok {
		r1 = rf(ctx)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GenerateNewPublicDashboardUid provides a mock function with given fields: ctx
func (_m *FakePublicDashboardStore) GenerateNewPublicDashboardUid(ctx context.Context) (string, error) {
	ret := _m.Called(ctx)

	var r0 string
	if rf, ok := ret.Get(0).(func(context.Context) string); ok {
		r0 = rf(ctx)
	} else {
		r0 = ret.Get(0).(string)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context) error); ok {
		r1 = rf(ctx)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetDashboard provides a mock function with given fields: ctx, dashboardUid
func (_m *FakePublicDashboardStore) GetDashboard(ctx context.Context, dashboardUid string) (*models.Dashboard, error) {
	ret := _m.Called(ctx, dashboardUid)

	var r0 *models.Dashboard
	if rf, ok := ret.Get(0).(func(context.Context, string) *models.Dashboard); ok {
		r0 = rf(ctx, dashboardUid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*models.Dashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, dashboardUid)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetPublicDashboard provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) GetPublicDashboard(ctx context.Context, accessToken string) (*publicdashboardsmodels.PublicDashboard, *models.Dashboard, error) {
	ret := _m.Called(ctx, accessToken)

	var r0 *publicdashboardsmodels.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, string) *publicdashboardsmodels.PublicDashboard); ok {
		r0 = rf(ctx, accessToken)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*publicdashboardsmodels.PublicDashboard)
		}
	}

	var r1 *models.Dashboard
	if rf, ok := ret.Get(1).(func(context.Context, string) *models.Dashboard); ok {
		r1 = rf(ctx, accessToken)
	} else {
		if ret.Get(1) != nil {
			r1 = ret.Get(1).(*models.Dashboard)
		}
	}

	var r2 error
	if rf, ok := ret.Get(2).(func(context.Context, string) error); ok {
		r2 = rf(ctx, accessToken)
	} else {
		r2 = ret.Error(2)
	}

	return r0, r1, r2
}

// GetPublicDashboardByUid provides a mock function with given fields: ctx, uid
func (_m *FakePublicDashboardStore) GetPublicDashboardByUid(ctx context.Context, uid string) (*publicdashboardsmodels.PublicDashboard, error) {
	ret := _m.Called(ctx, uid)

	var r0 *publicdashboardsmodels.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, string) *publicdashboardsmodels.PublicDashboard); ok {
		r0 = rf(ctx, uid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*publicdashboardsmodels.PublicDashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, uid)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetPublicDashboardConfig provides a mock function with given fields: ctx, orgId, dashboardUid
func (_m *FakePublicDashboardStore) GetPublicDashboardConfig(ctx context.Context, orgId int64, dashboardUid string) (*publicdashboardsmodels.PublicDashboard, error) {
	ret := _m.Called(ctx, orgId, dashboardUid)

	var r0 *publicdashboardsmodels.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, int64, string) *publicdashboardsmodels.PublicDashboard); ok {
		r0 = rf(ctx, orgId, dashboardUid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*publicdashboardsmodels.PublicDashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, int64, string) error); ok {
		r1 = rf(ctx, orgId, dashboardUid)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetPublicDashboardOrgId provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) GetPublicDashboardOrgId(ctx context.Context, accessToken string) (int64, error) {
	ret := _m.Called(ctx, accessToken)

	var r0 int64
	if rf, ok := ret.Get(0).(func(context.Context, string) int64); ok {
		r0 = rf(ctx, accessToken)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, accessToken)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// ListPublicDashboards provides a mock function with given fields: ctx, orgId
func (_m *FakePublicDashboardStore) ListPublicDashboards(ctx context.Context, orgId int64) ([]publicdashboardsmodels.PublicDashboardListResponse, error) {
	ret := _m.Called(ctx, orgId)

	var r0 []publicdashboardsmodels.PublicDashboardListResponse
	if rf, ok := ret.Get(0).(func(context.Context, int64) []publicdashboardsmodels.PublicDashboardListResponse); ok {
		r0 = rf(ctx, orgId)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]publicdashboardsmodels.PublicDashboardListResponse)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, int64) error); ok {
		r1 = rf(ctx, orgId)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PublicDashboardEnabled provides a mock function with given fields: ctx, dashboardUid
func (_m *FakePublicDashboardStore) PublicDashboardEnabled(ctx context.Context, dashboardUid string) (bool, error) {
	ret := _m.Called(ctx, dashboardUid)

	var r0 bool
	if rf, ok := ret.Get(0).(func(context.Context, string) bool); ok {
		r0 = rf(ctx, dashboardUid)
	} else {
		r0 = ret.Get(0).(bool)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, dashboardUid)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// SavePublicDashboardConfig provides a mock function with given fields: ctx, cmd
func (_m *FakePublicDashboardStore) SavePublicDashboardConfig(ctx context.Context, cmd publicdashboardsmodels.SavePublicDashboardConfigCommand) error {
	ret := _m.Called(ctx, cmd)

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, publicdashboardsmodels.SavePublicDashboardConfigCommand) error); ok {
		r0 = rf(ctx, cmd)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// UpdatePublicDashboardConfig provides a mock function with given fields: ctx, cmd
func (_m *FakePublicDashboardStore) UpdatePublicDashboardConfig(ctx context.Context, cmd publicdashboardsmodels.SavePublicDashboardConfigCommand) error {
	ret := _m.Called(ctx, cmd)

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, publicdashboardsmodels.SavePublicDashboardConfigCommand) error); ok {
		r0 = rf(ctx, cmd)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// NewFakePublicDashboardStore creates a new instance of FakePublicDashboardStore. It also registers the testing.TB interface on the mock and a cleanup function to assert the mocks expectations.
func NewFakePublicDashboardStore(t testing.TB) *FakePublicDashboardStore {
	mock := &FakePublicDashboardStore{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
