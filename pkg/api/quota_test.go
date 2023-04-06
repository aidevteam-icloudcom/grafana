package api

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/setting"
)

var (
	getCurrentOrgQuotasURL = "/api/org/quotas"
	getOrgsQuotasURL       = "/api/orgs/%v/quotas"
	putOrgsQuotasURL       = "/api/orgs/%v/quotas/%v"

	testUpdateOrgQuotaCmd = `{ "limit": 20 }`
)

// setupDBAndSettingsForAccessControlQuotaTests stores users and create two orgs
func setupDBAndSettingsForAccessControlQuotaTests(t *testing.T, sc accessControlScenarioContext) {
	t.Helper()

	// Create two orgs with the context user
	setupOrgsDBForAccessControlTests(t, sc.db, sc, 2)
}

func TestAPIEndpoint_GetCurrentOrgQuotas_LegacyAccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota.Enabled = true
	cfg.RBACEnabled = false
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setInitCtxSignedInViewer(sc.initCtx)

	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	t.Run("Viewer can view CurrentOrgQuotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodGet, getCurrentOrgQuotasURL, nil, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})

	sc.initCtx.IsSignedIn = false
	t.Run("Unsigned user cannot view CurrentOrgQuotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodGet, getCurrentOrgQuotasURL, nil, t)
		assert.Equal(t, http.StatusUnauthorized, response.Code)
	})
}

func TestAPIEndpoint_GetCurrentOrgQuotas_AccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota.Enabled = true
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setInitCtxSignedInViewer(sc.initCtx)

	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	t.Run("AccessControl allows viewing CurrentOrgQuotas with correct permissions", func(t *testing.T) {
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasRead}}, sc.initCtx.OrgID)
		response := callAPI(sc.server, http.MethodGet, getCurrentOrgQuotasURL, nil, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})
	t.Run("AccessControl prevents viewing CurrentOrgQuotas with correct permissions in another org", func(t *testing.T) {
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasRead}}, 2)
		response := callAPI(sc.server, http.MethodGet, getCurrentOrgQuotasURL, nil, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})
	t.Run("AccessControl prevents viewing CurrentOrgQuotas with incorrect permissions", func(t *testing.T) {
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: "orgs:invalid"}}, sc.initCtx.OrgID)
		response := callAPI(sc.server, http.MethodGet, getCurrentOrgQuotasURL, nil, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})
}

func TestAPIEndpoint_GetOrgQuotas_LegacyAccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota.Enabled = true
	cfg.RBACEnabled = false
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setInitCtxSignedInViewer(sc.initCtx)

	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	t.Run("Viewer cannot view another org quotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodGet, fmt.Sprintf(getOrgsQuotasURL, 2), nil, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})

	sc.initCtx.SignedInUser.IsGrafanaAdmin = true
	t.Run("Grafana admin viewer can view another org quotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodGet, fmt.Sprintf(getOrgsQuotasURL, 2), nil, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})
}

func TestAPIEndpoint_GetOrgQuotas_AccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota.Enabled = true
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	t.Run("AccessControl allows viewing another org quotas with correct permissions", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasRead}}, 2)
		response := callAPI(sc.server, http.MethodGet, fmt.Sprintf(getOrgsQuotasURL, 2), nil, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})
	t.Run("AccessControl prevents viewing another org quotas with correct permissions in another org", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasRead}}, 1)
		response := callAPI(sc.server, http.MethodGet, fmt.Sprintf(getOrgsQuotasURL, 2), nil, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})
	t.Run("AccessControl prevents viewing another org quotas with incorrect permissions", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: "orgs:invalid"}}, 2)
		response := callAPI(sc.server, http.MethodGet, fmt.Sprintf(getOrgsQuotasURL, 2), nil, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})
}

func TestAPIEndpoint_PutOrgQuotas_LegacyAccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota.Enabled = true
	cfg.RBACEnabled = false
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setInitCtxSignedInViewer(sc.initCtx)

	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	input := strings.NewReader(testUpdateOrgQuotaCmd)
	t.Run("Viewer cannot update another org quotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodPut, fmt.Sprintf(putOrgsQuotasURL, 2, "org_user"), input, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})

	sc.initCtx.SignedInUser.IsGrafanaAdmin = true
	input = strings.NewReader(testUpdateOrgQuotaCmd)
	t.Run("Grafana admin viewer can update another org quotas", func(t *testing.T) {
		response := callAPI(sc.server, http.MethodPut, fmt.Sprintf(putOrgsQuotasURL, 2, "org_user"), input, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})
}

func TestAPIEndpoint_PutOrgQuotas_AccessControl(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Quota = setting.QuotaSettings{
		Enabled: true,
		Global: setting.GlobalQuota{
			Org: 5,
		},
		Org: setting.OrgQuota{
			User: 5,
		},
		User: setting.UserQuota{
			Org: 5,
		},
	}
	sc := setupHTTPServerWithCfg(t, true, cfg)
	setupDBAndSettingsForAccessControlQuotaTests(t, sc)

	input := strings.NewReader(testUpdateOrgQuotaCmd)
	t.Run("AccessControl allows updating another org quotas with correct permissions", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasWrite}}, 2)
		response := callAPI(sc.server, http.MethodPut, fmt.Sprintf(putOrgsQuotasURL, 2, "org_user"), input, t)
		assert.Equal(t, http.StatusOK, response.Code)
	})

	input = strings.NewReader(testUpdateOrgQuotaCmd)
	t.Run("AccessControl prevents updating another org quotas with correct permissions in another org", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsQuotasWrite}}, 1)
		response := callAPI(sc.server, http.MethodPut, fmt.Sprintf(putOrgsQuotasURL, 2, "org_user"), input, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})

	input = strings.NewReader(testUpdateOrgQuotaCmd)
	t.Run("AccessControl prevents updating another org quotas with incorrect permissions", func(t *testing.T) {
		setInitCtxSignedInViewer(sc.initCtx)
		setAccessControlPermissions(sc.acmock, []accesscontrol.Permission{{Action: "orgs:invalid"}}, 2)
		response := callAPI(sc.server, http.MethodPut, fmt.Sprintf(putOrgsQuotasURL, 2, "org_user"), input, t)
		assert.Equal(t, http.StatusForbidden, response.Code)
	})
}
