// +build integration

package sqlstore

import (
	"context"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSQLBuilder(t *testing.T) {
	t.Run("WriteDashboardPermissionFilter", func(t *testing.T) {
		t.Run("user ACL", func(t *testing.T) {
			test(t,
				DashboardProps{},
				&DashboardPermission{User: true, Permission: models.PERMISSION_VIEW},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_VIEW},
				shouldFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{User: true, Permission: models.PERMISSION_VIEW},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_EDIT},
				shouldNotFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{User: true, Permission: models.PERMISSION_EDIT},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_EDIT},
				shouldFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{User: true, Permission: models.PERMISSION_VIEW},
				Search{RequiredPermission: models.PERMISSION_VIEW},
				shouldNotFind,
			)
		})

		t.Run("role ACL", func(t *testing.T) {
			test(t,
				DashboardProps{},
				&DashboardPermission{Role: models.ROLE_VIEWER, Permission: models.PERMISSION_VIEW},
				Search{UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_VIEW},
				shouldFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Role: models.ROLE_VIEWER, Permission: models.PERMISSION_VIEW},
				Search{UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_EDIT},
				shouldNotFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Role: models.ROLE_EDITOR, Permission: models.PERMISSION_VIEW},
				Search{UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_VIEW},
				shouldNotFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Role: models.ROLE_EDITOR, Permission: models.PERMISSION_VIEW},
				Search{UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_VIEW},
				shouldNotFind,
			)
		})

		t.Run("team ACL", func(t *testing.T) {
			test(t,
				DashboardProps{},
				&DashboardPermission{Team: true, Permission: models.PERMISSION_VIEW},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_VIEW},
				shouldFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Team: true, Permission: models.PERMISSION_VIEW},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_EDIT},
				shouldNotFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Team: true, Permission: models.PERMISSION_EDIT},
				Search{UserFromACL: true, RequiredPermission: models.PERMISSION_EDIT},
				shouldFind,
			)

			test(t,
				DashboardProps{},
				&DashboardPermission{Team: true, Permission: models.PERMISSION_EDIT},
				Search{UserFromACL: false, RequiredPermission: models.PERMISSION_EDIT},
				shouldNotFind,
			)
		})

		t.Run("defaults for user ACL", func(t *testing.T) {
			test(t,
				DashboardProps{},
				nil,
				Search{OrgId: -1, UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_VIEW},
				shouldNotFind,
			)

			test(t,
				DashboardProps{OrgId: -1},
				nil,
				Search{OrgId: -1, UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_VIEW},
				shouldFind,
			)

			test(t,
				DashboardProps{OrgId: -1},
				nil,
				Search{OrgId: -1, UsersOrgRole: models.ROLE_EDITOR, RequiredPermission: models.PERMISSION_EDIT},
				shouldFind,
			)

			test(t,
				DashboardProps{OrgId: -1},
				nil,
				Search{OrgId: -1, UsersOrgRole: models.ROLE_VIEWER, RequiredPermission: models.PERMISSION_EDIT},
				shouldNotFind,
			)
		})
	})
}

var shouldFind = true
var shouldNotFind = false

type DashboardProps struct {
	OrgId int64
}

type DashboardPermission struct {
	User       bool
	Team       bool
	Role       models.RoleType
	Permission models.PermissionType
}

type Search struct {
	UsersOrgRole       models.RoleType
	UserFromACL        bool
	RequiredPermission models.PermissionType
	OrgId              int64
}

type dashboardResponse struct {
	Id int64
}

func test(t *testing.T, dashboardProps DashboardProps, dashboardPermission *DashboardPermission, search Search, shouldFind bool) {
	t.Helper()

	// Will also cleanup the db
	sqlStore := InitTestDB(t)

	dashboard := createDummyDashboard(t, sqlStore, dashboardProps)

	var aclUserId int64
	if dashboardPermission != nil {
		aclUserId = createDummyAcl(t, sqlStore, dashboardPermission, search, dashboard.Id)
	}
	dashboards := getDashboards(t, sqlStore, search, aclUserId)

	if shouldFind {
		assert.Len(t, dashboards, 1, "Should return one dashboard")
		assert.Equal(t, dashboards[0].Id, dashboard.Id, "Should return created dashboard")
	} else {
		assert.Empty(t, dashboards, "Should not return any dashboard")
	}
}

func createDummyUser(t *testing.T, sqlStore *SQLStore) *models.User {
	t.Helper()

	uid := strconv.Itoa(rand.Intn(9999999))
	createUserCmd := &models.CreateUserCommand{
		Email:          uid + "@example.com",
		Login:          uid,
		Name:           uid,
		Company:        "",
		OrgName:        "",
		Password:       uid,
		EmailVerified:  true,
		IsAdmin:        false,
		SkipOrgSetup:   false,
		DefaultOrgRole: string(models.ROLE_VIEWER),
	}
	err := CreateUser(context.Background(), createUserCmd)
	require.NoError(t, err)

	return &createUserCmd.Result
}

func createDummyTeam(t *testing.T, sqlStore *SQLStore) *models.Team {
	t.Helper()

	cmd := &models.CreateTeamCommand{
		// Does not matter in this tests actually
		OrgId: 1,
		Name:  "test",
		Email: "test@example.com",
	}
	err := CreateTeam(cmd)
	require.NoError(t, err)

	return &cmd.Result
}

func createDummyDashboard(t *testing.T, sqlStore *SQLStore, dashboardProps DashboardProps) *models.Dashboard {
	t.Helper()

	json, err := simplejson.NewJson([]byte(`{"schemaVersion":17,"title":"gdev dashboards","uid":"","version":1}`))
	require.NoError(t, err)

	saveDashboardCmd := models.SaveDashboardCommand{
		Dashboard:    json,
		UserId:       0,
		Overwrite:    false,
		Message:      "",
		RestoredFrom: 0,
		PluginId:     "",
		FolderId:     0,
		IsFolder:     false,
		UpdatedAt:    time.Time{},
	}
	if dashboardProps.OrgId != 0 {
		saveDashboardCmd.OrgId = dashboardProps.OrgId
	} else {
		saveDashboardCmd.OrgId = 1
	}

	dash, err := sqlStore.SaveDashboard(saveDashboardCmd)
	require.NoError(t, err)

	return dash
}

func createDummyAcl(t *testing.T, sqlStore *SQLStore, dashboardPermission *DashboardPermission, search Search, dashboardID int64) int64 {
	t.Helper()

	acl := &models.DashboardAcl{
		OrgID:       1,
		Created:     time.Now(),
		Updated:     time.Now(),
		Permission:  dashboardPermission.Permission,
		DashboardID: dashboardID,
	}

	var user *models.User
	if dashboardPermission.User {
		user = createDummyUser(t, sqlStore)

		acl.UserID = user.Id
	}

	if dashboardPermission.Team {
		team := createDummyTeam(t, sqlStore)
		if search.UserFromACL {
			user := createDummyUser(t, sqlStore)
			addTeamMemberCmd := &models.AddTeamMemberCommand{
				UserId: user.Id,
				OrgId:  1,
				TeamId: team.Id,
			}
			err := AddTeamMember(addTeamMemberCmd)
			require.NoError(t, err)
		}

		acl.TeamID = team.Id
	}

	if len(string(dashboardPermission.Role)) > 0 {
		acl.Role = &dashboardPermission.Role
	}

	err := sqlStore.UpdateDashboardACL(dashboardID, []*models.DashboardAcl{acl})
	require.NoError(t, err)
	if user != nil {
		return user.Id
	}
	return 0
}

func getDashboards(t *testing.T, sqlStore *SQLStore, search Search, aclUserId int64) []*dashboardResponse {
	t.Helper()

	builder := &SQLBuilder{}
	signedInUser := &models.SignedInUser{
		UserId: 9999999999,
	}

	if search.OrgId == 0 {
		signedInUser.OrgId = 1
	} else {
		signedInUser.OrgId = search.OrgId
	}

	if len(string(search.UsersOrgRole)) > 0 {
		signedInUser.OrgRole = search.UsersOrgRole
	} else {
		signedInUser.OrgRole = models.ROLE_VIEWER
	}
	if search.UserFromACL {
		signedInUser.UserId = aclUserId
	}

	var res []*dashboardResponse
	builder.Write("SELECT * FROM dashboard WHERE true")
	builder.WriteDashboardPermissionFilter(signedInUser, search.RequiredPermission)
	err := sqlStore.engine.SQL(builder.GetSQLString(), builder.params...).Find(&res)
	require.NoError(t, err)
	return res
}
