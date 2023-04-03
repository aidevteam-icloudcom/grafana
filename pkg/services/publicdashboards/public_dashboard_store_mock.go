// Code generated by mockery v2.16.0. DO NOT EDIT.

package publicdashboards

import (
	context "context"

	dashboards "github.com/grafana/grafana/pkg/services/dashboards"
	mock "github.com/stretchr/testify/mock"

	models "github.com/grafana/grafana/pkg/services/publicdashboards/models"
)

// FakePublicDashboardStore is an autogenerated mock type for the Store type
type FakePublicDashboardStore struct {
	mock.Mock
}

// Create provides a mock function with given fields: ctx, cmd
func (_m *FakePublicDashboardStore) Create(ctx context.Context, cmd models.SavePublicDashboardCommand) (int64, error) {
	ret := _m.Called(ctx, cmd)

	var r0 int64
	if rf, ok := ret.Get(0).(func(context.Context, models.SavePublicDashboardCommand) int64); ok {
		r0 = rf(ctx, cmd)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, models.SavePublicDashboardCommand) error); ok {
		r1 = rf(ctx, cmd)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Delete provides a mock function with given fields: ctx, uid
func (_m *FakePublicDashboardStore) Delete(ctx context.Context, uid string) (int64, error) {
	ret := _m.Called(ctx, uid)

	var r0 int64
	if rf, ok := ret.Get(0).(func(context.Context, string) int64); ok {
		r0 = rf(ctx, uid)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, uid)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// ExistsEnabledByAccessToken provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) ExistsEnabledByAccessToken(ctx context.Context, accessToken string) (bool, error) {
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

// ExistsEnabledByDashboardUid provides a mock function with given fields: ctx, dashboardUid
func (_m *FakePublicDashboardStore) ExistsEnabledByDashboardUid(ctx context.Context, dashboardUid string) (bool, error) {
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

// Find provides a mock function with given fields: ctx, uid
func (_m *FakePublicDashboardStore) Find(ctx context.Context, uid string) (*models.PublicDashboard, error) {
	ret := _m.Called(ctx, uid)

	var r0 *models.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, string) *models.PublicDashboard); ok {
		r0 = rf(ctx, uid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*models.PublicDashboard)
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

// FindAll provides a mock function with given fields: ctx, orgId
func (_m *FakePublicDashboardStore) FindAll(ctx context.Context, orgId int64) ([]models.PublicDashboardListResponse, error) {
	ret := _m.Called(ctx, orgId)

	var r0 []models.PublicDashboardListResponse
	if rf, ok := ret.Get(0).(func(context.Context, int64) []models.PublicDashboardListResponse); ok {
		r0 = rf(ctx, orgId)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]models.PublicDashboardListResponse)
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

// FindByAccessToken provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) FindByAccessToken(ctx context.Context, accessToken string) (*models.PublicDashboard, error) {
	ret := _m.Called(ctx, accessToken)

	var r0 *models.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, string) *models.PublicDashboard); ok {
		r0 = rf(ctx, accessToken)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*models.PublicDashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, string) error); ok {
		r1 = rf(ctx, accessToken)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// FindByDashboardFolder provides a mock function with given fields: ctx, dashboard
func (_m *FakePublicDashboardStore) FindByDashboardFolder(ctx context.Context, dashboard *dashboards.Dashboard) ([]*models.PublicDashboard, error) {
	ret := _m.Called(ctx, dashboard)

	var r0 []*models.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, *dashboards.Dashboard) []*models.PublicDashboard); ok {
		r0 = rf(ctx, dashboard)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]*models.PublicDashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, *dashboards.Dashboard) error); ok {
		r1 = rf(ctx, dashboard)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// FindByDashboardUid provides a mock function with given fields: ctx, orgId, dashboardUid
func (_m *FakePublicDashboardStore) FindByDashboardUid(ctx context.Context, orgId int64, dashboardUid string) (*models.PublicDashboard, error) {
	ret := _m.Called(ctx, orgId, dashboardUid)

	var r0 *models.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, int64, string) *models.PublicDashboard); ok {
		r0 = rf(ctx, orgId, dashboardUid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*models.PublicDashboard)
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

// FindDashboard provides a mock function with given fields: ctx, orgId, dashboardUid
func (_m *FakePublicDashboardStore) FindDashboard(ctx context.Context, orgId int64, dashboardUid string) (*dashboards.Dashboard, error) {
	ret := _m.Called(ctx, orgId, dashboardUid)

	var r0 *dashboards.Dashboard
	if rf, ok := ret.Get(0).(func(context.Context, int64, string) *dashboards.Dashboard); ok {
		r0 = rf(ctx, orgId, dashboardUid)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*dashboards.Dashboard)
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

// GetOrgIdByAccessToken provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardStore) GetOrgIdByAccessToken(ctx context.Context, accessToken string) (int64, error) {
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

// Update provides a mock function with given fields: ctx, cmd
func (_m *FakePublicDashboardStore) Update(ctx context.Context, cmd models.SavePublicDashboardCommand) (int64, error) {
	ret := _m.Called(ctx, cmd)

	var r0 int64
	if rf, ok := ret.Get(0).(func(context.Context, models.SavePublicDashboardCommand) int64); ok {
		r0 = rf(ctx, cmd)
	} else {
		r0 = ret.Get(0).(int64)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, models.SavePublicDashboardCommand) error); ok {
		r1 = rf(ctx, cmd)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

type mockConstructorTestingTNewFakePublicDashboardStore interface {
	mock.TestingT
	Cleanup(func())
}

// NewFakePublicDashboardStore creates a new instance of FakePublicDashboardStore. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
func NewFakePublicDashboardStore(t mockConstructorTestingTNewFakePublicDashboardStore) *FakePublicDashboardStore {
	mock := &FakePublicDashboardStore{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
