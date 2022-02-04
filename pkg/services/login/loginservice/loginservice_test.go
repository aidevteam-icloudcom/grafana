package loginservice

import (
	"bytes"
	"context"
	"errors"
	"testing"

	"github.com/go-kit/log"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/log/level"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/quota"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_syncOrgRoles_doesNotBreakWhenTryingToRemoveLastOrgAdmin(t *testing.T) {
	user := createSimpleUser()
	externalUser := createSimpleExternalUser()
	remResp := createResponseWithOneErrLastOrgAdminItem()

	bus.ClearBusHandlers()
	defer bus.ClearBusHandlers()
	bus.AddHandler("test", func(ctx context.Context, q *models.GetUserOrgListQuery) error {
		q.Result = createUserOrgDTO()

		return nil
	})

	bus.AddHandler("test", func(ctx context.Context, cmd *models.RemoveOrgUserCommand) error {
		testData := remResp[0]
		remResp = remResp[1:]

		require.Equal(t, testData.orgId, cmd.OrgId)
		return testData.response
	})
	bus.AddHandler("test", func(ctx context.Context, cmd *models.SetUsingOrgCommand) error {
		return nil
	})

	err := syncOrgRoles(context.Background(), &user, &externalUser)
	require.Empty(t, remResp)
	require.NoError(t, err)
}

func Test_syncOrgRoles_whenTryingToRemoveLastOrgLogsError(t *testing.T) {
	buf := &bytes.Buffer{}
	logger.Swap(level.NewFilter(log.NewLogfmtLogger(buf), level.AllowInfo()))

	user := createSimpleUser()
	externalUser := createSimpleExternalUser()
	remResp := createResponseWithOneErrLastOrgAdminItem()

	bus.ClearBusHandlers()
	defer bus.ClearBusHandlers()
	bus.AddHandler("test", func(ctx context.Context, q *models.GetUserOrgListQuery) error {
		q.Result = createUserOrgDTO()
		return nil
	})

	bus.AddHandler("test", func(ctx context.Context, cmd *models.RemoveOrgUserCommand) error {
		testData := remResp[0]
		remResp = remResp[1:]

		require.Equal(t, testData.orgId, cmd.OrgId)
		return testData.response
	})
	bus.AddHandler("test", func(ctx context.Context, cmd *models.SetUsingOrgCommand) error {
		return nil
	})

	err := syncOrgRoles(context.Background(), &user, &externalUser)
	require.NoError(t, err)
	assert.Contains(t, buf.String(), models.ErrLastOrgAdmin.Error())
}

type authInfoServiceMock struct {
	user *models.User
	err  error
}

func (a *authInfoServiceMock) LookupAndUpdate(ctx context.Context, query *models.GetUserByAuthInfoQuery) (*models.User, error) {
	return a.user, a.err
}

func (a *authInfoServiceMock) GetAuthInfo(ctx context.Context, query *models.GetAuthInfoQuery) error {
	return nil
}

func Test_teamSync(t *testing.T) {
	b := bus.New()
	authInfoMock := &authInfoServiceMock{}
	login := Implementation{
		Bus:             b,
		QuotaService:    &quota.QuotaService{},
		AuthInfoService: authInfoMock,
	}

	upserCmd := &models.UpsertUserCommand{ExternalUser: &models.ExternalUserInfo{Email: "test_user@example.org"}}
	expectedUser := &models.User{
		Id:    1,
		Email: "test_user@example.org",
		Name:  "test_user",
		Login: "test_user",
	}
	authInfoMock.user = expectedUser
	bus.ClearBusHandlers()
	t.Cleanup(func() { bus.ClearBusHandlers() })

	var actualUser *models.User
	var actualExternalUser *models.ExternalUserInfo

	t.Run("login.TeamSync should not be called when  nil", func(t *testing.T) {
		err := login.UpsertUser(context.Background(), upserCmd)
		require.Nil(t, err)
		assert.Nil(t, actualUser)
		assert.Nil(t, actualExternalUser)

		t.Run("login.TeamSync should be called when not nil", func(t *testing.T) {
			teamSyncFunc := func(user *models.User, externalUser *models.ExternalUserInfo) error {
				actualUser = user
				actualExternalUser = externalUser
				return nil
			}
			login.TeamSync = teamSyncFunc
			err := login.UpsertUser(context.Background(), upserCmd)
			require.Nil(t, err)
			assert.Equal(t, actualUser, expectedUser)
			assert.Equal(t, actualExternalUser, upserCmd.ExternalUser)
		})

		t.Run("login.TeamSync should propagate its errors to the caller", func(t *testing.T) {
			teamSyncFunc := func(user *models.User, externalUser *models.ExternalUserInfo) error {
				return errors.New("teamsync test error")
			}
			login.TeamSync = teamSyncFunc
			err := login.UpsertUser(context.Background(), upserCmd)
			require.Error(t, err)
		})
	})
}

func createSimpleUser() models.User {
	user := models.User{
		Id: 1,
	}

	return user
}

func createUserOrgDTO() []*models.UserOrgDTO {
	users := []*models.UserOrgDTO{
		{
			OrgId: 1,
			Name:  "Bar",
			Role:  models.ROLE_VIEWER,
		},
		{
			OrgId: 10,
			Name:  "Foo",
			Role:  models.ROLE_ADMIN,
		},
		{
			OrgId: 11,
			Name:  "Stuff",
			Role:  models.ROLE_VIEWER,
		},
	}
	return users
}

func createSimpleExternalUser() models.ExternalUserInfo {
	externalUser := models.ExternalUserInfo{
		AuthModule: "ldap",
		OrgRoles: map[int64]models.RoleType{
			1: models.ROLE_VIEWER,
		},
	}

	return externalUser
}

func createResponseWithOneErrLastOrgAdminItem() []struct {
	orgId    int64
	response error
} {
	remResp := []struct {
		orgId    int64
		response error
	}{
		{
			orgId:    10,
			response: models.ErrLastOrgAdmin,
		},
		{
			orgId:    11,
			response: nil,
		},
	}
	return remResp
}
