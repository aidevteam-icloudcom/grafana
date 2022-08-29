// Code generated by mockery v2.12.1. DO NOT EDIT.

package publicdashboards

import (
	context "context"

	dtos "github.com/grafana/grafana/pkg/api/dtos"
	mock "github.com/stretchr/testify/mock"

	models "github.com/grafana/grafana/pkg/models"

	publicdashboardsmodels "github.com/grafana/grafana/pkg/services/publicdashboards/models"

	testing "testing"

	user "github.com/grafana/grafana/pkg/services/user"
)

// FakePublicDashboardService is an autogenerated mock type for the Service type
type FakePublicDashboardService struct {
	mock.Mock
}

// AccessTokenExists provides a mock function with given fields: ctx, accessToken
func (_m *FakePublicDashboardService) AccessTokenExists(ctx context.Context, accessToken string) (bool, error) {
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

// BuildAnonymousUser provides a mock function with given fields: ctx, dashboard
func (_m *FakePublicDashboardService) BuildAnonymousUser(ctx context.Context, dashboard *models.Dashboard) (*user.SignedInUser, error) {
	ret := _m.Called(ctx, dashboard)

	var r0 *user.SignedInUser
	if rf, ok := ret.Get(0).(func(context.Context, *models.Dashboard) *user.SignedInUser); ok {
		r0 = rf(ctx, dashboard)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*user.SignedInUser)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, *models.Dashboard) error); ok {
		r1 = rf(ctx, dashboard)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// BuildPublicDashboardMetricRequest provides a mock function with given fields: ctx, dashboard, publicDashboard, panelId
func (_m *FakePublicDashboardService) BuildPublicDashboardMetricRequest(ctx context.Context, dashboard *models.Dashboard, publicDashboard *publicdashboardsmodels.PublicDashboard, panelId int64) (dtos.MetricRequest, error) {
	ret := _m.Called(ctx, dashboard, publicDashboard, panelId)

	var r0 dtos.MetricRequest
	if rf, ok := ret.Get(0).(func(context.Context, *models.Dashboard, *publicdashboardsmodels.PublicDashboard, int64) dtos.MetricRequest); ok {
		r0 = rf(ctx, dashboard, publicDashboard, panelId)
	} else {
		r0 = ret.Get(0).(dtos.MetricRequest)
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, *models.Dashboard, *publicdashboardsmodels.PublicDashboard, int64) error); ok {
		r1 = rf(ctx, dashboard, publicDashboard, panelId)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetDashboard provides a mock function with given fields: ctx, dashboardUid
func (_m *FakePublicDashboardService) GetDashboard(ctx context.Context, dashboardUid string) (*models.Dashboard, error) {
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
func (_m *FakePublicDashboardService) GetPublicDashboard(ctx context.Context, accessToken string) (*publicdashboardsmodels.PublicDashboard, *models.Dashboard, error) {
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

// GetPublicDashboardConfig provides a mock function with given fields: ctx, orgId, dashboardUid
func (_m *FakePublicDashboardService) GetPublicDashboardConfig(ctx context.Context, orgId int64, dashboardUid string) (*publicdashboardsmodels.PublicDashboard, error) {
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

// PublicDashboardEnabled provides a mock function with given fields: ctx, dashboardUid
func (_m *FakePublicDashboardService) PublicDashboardEnabled(ctx context.Context, dashboardUid string) (bool, error) {
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

// SavePublicDashboardConfig provides a mock function with given fields: ctx, u, dto
func (_m *FakePublicDashboardService) SavePublicDashboardConfig(ctx context.Context, u *user.SignedInUser, dto *publicdashboardsmodels.SavePublicDashboardConfigDTO) (*publicdashboardsmodels.PublicDashboard, error) {
	ret := _m.Called(ctx, u, dto)

	var r0 *publicdashboardsmodels.PublicDashboard
	if rf, ok := ret.Get(0).(func(context.Context, *user.SignedInUser, *publicdashboardsmodels.SavePublicDashboardConfigDTO) *publicdashboardsmodels.PublicDashboard); ok {
		r0 = rf(ctx, u, dto)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*publicdashboardsmodels.PublicDashboard)
		}
	}

	var r1 error
	if rf, ok := ret.Get(1).(func(context.Context, *user.SignedInUser, *publicdashboardsmodels.SavePublicDashboardConfigDTO) error); ok {
		r1 = rf(ctx, u, dto)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// NewFakePublicDashboardService creates a new instance of FakePublicDashboardService. It also registers the testing.TB interface on the mock and a cleanup function to assert the mocks expectations.
func NewFakePublicDashboardService(t testing.TB) *FakePublicDashboardService {
	mock := &FakePublicDashboardService{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
