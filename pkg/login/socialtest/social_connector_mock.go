// Code generated by mockery v2.27.1. DO NOT EDIT.

package socialtest

import (
	bytes "bytes"
	context "context"

	http "net/http"

	mock "github.com/stretchr/testify/mock"

	oauth2 "golang.org/x/oauth2"

	social "github.com/grafana/grafana/pkg/login/social"
)

// MockSocialConnector is an autogenerated mock type for the SocialConnector type
type MockSocialConnector struct {
	mock.Mock
}

// AuthCodeURL provides a mock function with given fields: state, opts
func (_m *MockSocialConnector) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	_va := make([]any, len(opts))
	for _i := range opts {
		_va[_i] = opts[_i]
	}
	var _ca []any
	_ca = append(_ca, state)
	_ca = append(_ca, _va...)
	ret := _m.Called(_ca...)

	var r0 string
	if rf, ok := ret.Get(0).(func(string, ...oauth2.AuthCodeOption) string); ok {
		r0 = rf(state, opts...)
	} else {
		r0 = ret.Get(0).(string)
	}

	return r0
}

// Client provides a mock function with given fields: ctx, t
func (_m *MockSocialConnector) Client(ctx context.Context, t *oauth2.Token) *http.Client {
	ret := _m.Called(ctx, t)

	var r0 *http.Client
	if rf, ok := ret.Get(0).(func(context.Context, *oauth2.Token) *http.Client); ok {
		r0 = rf(ctx, t)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*http.Client)
		}
	}

	return r0
}

// Exchange provides a mock function with given fields: ctx, code, authOptions
func (_m *MockSocialConnector) Exchange(ctx context.Context, code string, authOptions ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	_va := make([]any, len(authOptions))
	for _i := range authOptions {
		_va[_i] = authOptions[_i]
	}
	var _ca []any
	_ca = append(_ca, ctx, code)
	_ca = append(_ca, _va...)
	ret := _m.Called(_ca...)

	var r0 *oauth2.Token
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, string, ...oauth2.AuthCodeOption) (*oauth2.Token, error)); ok {
		return rf(ctx, code, authOptions...)
	}
	if rf, ok := ret.Get(0).(func(context.Context, string, ...oauth2.AuthCodeOption) *oauth2.Token); ok {
		r0 = rf(ctx, code, authOptions...)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*oauth2.Token)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, string, ...oauth2.AuthCodeOption) error); ok {
		r1 = rf(ctx, code, authOptions...)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetOAuthInfo provides a mock function with given fields:
func (_m *MockSocialConnector) GetOAuthInfo() *social.OAuthInfo {
	ret := _m.Called()

	var r0 *social.OAuthInfo
	if rf, ok := ret.Get(0).(func() *social.OAuthInfo); ok {
		r0 = rf()
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*social.OAuthInfo)
		}
	}

	return r0
}

// IsEmailAllowed provides a mock function with given fields: email
func (_m *MockSocialConnector) IsEmailAllowed(email string) bool {
	ret := _m.Called(email)

	var r0 bool
	if rf, ok := ret.Get(0).(func(string) bool); ok {
		r0 = rf(email)
	} else {
		r0 = ret.Get(0).(bool)
	}

	return r0
}

// IsSignupAllowed provides a mock function with given fields:
func (_m *MockSocialConnector) IsSignupAllowed() bool {
	ret := _m.Called()

	var r0 bool
	if rf, ok := ret.Get(0).(func() bool); ok {
		r0 = rf()
	} else {
		r0 = ret.Get(0).(bool)
	}

	return r0
}

// SupportBundleContent provides a mock function with given fields: _a0
func (_m *MockSocialConnector) SupportBundleContent(_a0 *bytes.Buffer) error {
	ret := _m.Called(_a0)

	var r0 error
	if rf, ok := ret.Get(0).(func(*bytes.Buffer) error); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// TokenSource provides a mock function with given fields: ctx, t
func (_m *MockSocialConnector) TokenSource(ctx context.Context, t *oauth2.Token) oauth2.TokenSource {
	ret := _m.Called(ctx, t)

	var r0 oauth2.TokenSource
	if rf, ok := ret.Get(0).(func(context.Context, *oauth2.Token) oauth2.TokenSource); ok {
		r0 = rf(ctx, t)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(oauth2.TokenSource)
		}
	}

	return r0
}

// UserInfo provides a mock function with given fields: ctx, client, token
func (_m *MockSocialConnector) UserInfo(ctx context.Context, client *http.Client, token *oauth2.Token) (*social.BasicUserInfo, error) {
	ret := _m.Called(ctx, client, token)

	var r0 *social.BasicUserInfo
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *http.Client, *oauth2.Token) (*social.BasicUserInfo, error)); ok {
		return rf(ctx, client, token)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *http.Client, *oauth2.Token) *social.BasicUserInfo); ok {
		r0 = rf(ctx, client, token)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*social.BasicUserInfo)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *http.Client, *oauth2.Token) error); ok {
		r1 = rf(ctx, client, token)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

type mockConstructorTestingTNewMockSocialConnector interface {
	mock.TestingT
	Cleanup(func())
}

// NewMockSocialConnector creates a new instance of MockSocialConnector. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
func NewMockSocialConnector(t mockConstructorTestingTNewMockSocialConnector) *MockSocialConnector {
	mock := &MockSocialConnector{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
