package login

import (
	"context"
	"errors"
	"testing"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/ldap"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/login/logintest"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/mockstore"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuthenticateUser(t *testing.T) {
	authScenario(t, "When a user authenticates without setting a password", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(false, nil, sc)
		mockLoginUsingLDAP(false, nil, sc)

		loginQuery := models.LoginUserQuery{
			Username: "user",
			Password: "",
		}
		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), &loginQuery)

		require.EqualError(t, err, ErrPasswordEmpty.Error())
		assert.False(t, sc.grafanaLoginWasCalled)
		assert.False(t, sc.ldapLoginWasCalled)
		assert.Empty(t, sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When a user authenticates having too many login attempts", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(ErrTooManyLoginAttempts, sc)
		mockLoginUsingGrafanaDB(true, nil, sc)
		mockLoginUsingLDAP(true, nil, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, ErrTooManyLoginAttempts.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.False(t, sc.grafanaLoginWasCalled)
		assert.False(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Empty(t, sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When grafana user authenticate with valid credentials", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, nil, sc)
		mockLoginUsingLDAP(true, ErrInvalidCredentials, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.NoError(t, err)
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.False(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "grafana", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When grafana user authenticate and unexpected error occurs", func(sc *authScenarioContext) {
		customErr := errors.New("custom")
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, customErr, sc)
		mockLoginUsingLDAP(true, ErrInvalidCredentials, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, customErr.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.False(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "grafana", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When a non-existing grafana user authenticate and ldap disabled", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, models.ErrUserNotFound, sc)
		mockLoginUsingLDAP(false, nil, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, models.ErrUserNotFound.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Empty(t, sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When a non-existing grafana user authenticate and invalid ldap credentials", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, models.ErrUserNotFound, sc)
		mockLoginUsingLDAP(true, ldap.ErrInvalidCredentials, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, ErrInvalidCredentials.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.True(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "ldap", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When a non-existing grafana user authenticate and valid ldap credentials", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, models.ErrUserNotFound, sc)
		mockLoginUsingLDAP(true, nil, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.NoError(t, err)
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "ldap", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When a non-existing grafana user authenticate and ldap returns unexpected error", func(sc *authScenarioContext) {
		customErr := errors.New("custom")
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, models.ErrUserNotFound, sc)
		mockLoginUsingLDAP(true, customErr, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, customErr.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "ldap", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When grafana user authenticate with invalid credentials and invalid ldap credentials", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(true, ErrInvalidCredentials, sc)
		mockLoginUsingLDAP(true, ldap.ErrInvalidCredentials, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.EqualError(t, err, ErrInvalidCredentials.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.True(t, sc.saveInvalidLoginAttemptWasCalled)
	})

	authScenario(t, "When grafana login provider is disabled, ldap login is performed", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(false, nil, sc)
		mockLoginUsingLDAP(true, nil, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		require.NoError(t, err)
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
		assert.Equal(t, "ldap", sc.loginUserQuery.AuthModule)
	})

	authScenario(t, "When grafana and ldap login providers are disabled", func(sc *authScenarioContext) {
		mockLoginAttemptValidation(nil, sc)
		mockLoginUsingGrafanaDB(false, nil, sc)
		mockLoginUsingLDAP(false, nil, sc)
		mockSaveInvalidLoginAttempt(sc)

		a := AuthenticatorService{store: mockstore.NewSQLStoreMock(), loginService: &logintest.LoginServiceFake{}}
		err := a.AuthenticateUser(context.Background(), sc.loginUserQuery)

		assert.EqualError(t, err, ErrNoLoginProviderEnabled.Error())
		assert.True(t, sc.loginAttemptValidationWasCalled)
		assert.True(t, sc.grafanaLoginWasCalled)
		assert.True(t, sc.ldapLoginWasCalled)
		assert.False(t, sc.saveInvalidLoginAttemptWasCalled)
	})
}

type authScenarioContext struct {
	loginUserQuery                   *models.LoginUserQuery
	grafanaLoginWasCalled            bool
	ldapLoginWasCalled               bool
	loginAttemptValidationWasCalled  bool
	saveInvalidLoginAttemptWasCalled bool
}

type authScenarioFunc func(sc *authScenarioContext)

func mockLoginUsingGrafanaDB(enabled bool, err error, sc *authScenarioContext) {
	loginUsingGrafanaDB = func(ctx context.Context, query *models.LoginUserQuery, _ sqlstore.Store) (bool, error) {
		sc.grafanaLoginWasCalled = true
		return enabled, err
	}
}

func mockLoginUsingLDAP(enabled bool, err error, sc *authScenarioContext) {
	loginUsingLDAP = func(ctx context.Context, query *models.LoginUserQuery, _ login.Service) (bool, error) {
		sc.ldapLoginWasCalled = true
		return enabled, err
	}
}

func mockLoginAttemptValidation(err error, sc *authScenarioContext) {
	validateLoginAttempts = func(context.Context, *models.LoginUserQuery, sqlstore.Store) error {
		sc.loginAttemptValidationWasCalled = true
		return err
	}
}

func mockSaveInvalidLoginAttempt(sc *authScenarioContext) {
	saveInvalidLoginAttempt = func(ctx context.Context, query *models.LoginUserQuery, _ sqlstore.Store) error {
		sc.saveInvalidLoginAttemptWasCalled = true
		return nil
	}
}

func authScenario(t *testing.T, desc string, fn authScenarioFunc) {
	t.Helper()

	t.Run(desc, func(t *testing.T) {
		origLoginUsingGrafanaDB := loginUsingGrafanaDB
		origLoginUsingLDAP := loginUsingLDAP
		origValidateLoginAttempts := validateLoginAttempts
		origSaveInvalidLoginAttempt := saveInvalidLoginAttempt

		sc := &authScenarioContext{
			loginUserQuery: &models.LoginUserQuery{
				Username:  "user",
				Password:  "pwd",
				IpAddress: "192.168.1.1:56433",
			},
		}

		t.Cleanup(func() {
			loginUsingGrafanaDB = origLoginUsingGrafanaDB
			loginUsingLDAP = origLoginUsingLDAP
			validateLoginAttempts = origValidateLoginAttempts
			saveInvalidLoginAttempt = origSaveInvalidLoginAttempt
		})

		fn(sc)
	})
}
