package authntest

import (
	"context"

	"github.com/grafana/grafana/pkg/services/authn"
)

type FakeService struct {
	authn.Service
}

var _ authn.ContextAwareClient = new(FakeClient)

type FakeClient struct {
	ExpectedName     string
	ExpectedErr      error
	ExpectedTest     bool
	ExpectedPriority uint
	ExpectedIdentity *authn.Identity
}

func (f *FakeClient) Name() string {
	return f.ExpectedName
}

func (f *FakeClient) Authenticate(ctx context.Context, r *authn.Request) (*authn.Identity, error) {
	return f.ExpectedIdentity, f.ExpectedErr
}

func (f *FakeClient) Test(ctx context.Context, r *authn.Request) bool {
	return f.ExpectedTest
}

func (f *FakeClient) Priority() uint {
	return f.ExpectedPriority
}

var _ authn.PasswordClient = new(FakePasswordClient)

type FakePasswordClient struct {
	ExpectedErr      error
	ExpectedIdentity *authn.Identity
}

func (f FakePasswordClient) AuthenticatePassword(ctx context.Context, r *authn.Request, username, password string) (*authn.Identity, error) {
	return f.ExpectedIdentity, f.ExpectedErr
}

var _ authn.RedirectClient = new(FakeRedirectClient)

type FakeRedirectClient struct {
	ExpectedErr      error
	ExpectedURL      string
	ExpectedOK       bool
	ExpectedIdentity *authn.Identity
}

func (f FakeRedirectClient) Authenticate(ctx context.Context, r *authn.Request) (*authn.Identity, error) {
	return f.ExpectedIdentity, f.ExpectedErr
}

func (f FakeRedirectClient) Test(ctx context.Context, r *authn.Request) bool {
	return f.ExpectedOK
}

func (f FakeRedirectClient) RedirectURL(ctx context.Context, r *authn.Request) (string, error) {
	return f.ExpectedURL, f.ExpectedErr
}
