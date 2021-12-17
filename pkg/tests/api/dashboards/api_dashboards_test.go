package dashboards

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/search"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDashboardQuota(t *testing.T) {
	// enable quota and set low dashboard quota
	// Setup Grafana and its Database
	dashboardQuota := int64(1)
	dir, path := testinfra.CreateGrafDir(t, testinfra.GrafanaOpts{
		DisableAnonymous:  true,
		EnableQuota:       true,
		DashboardOrgQuota: &dashboardQuota,
	})
	grafanaListedAddr, store := testinfra.StartGrafana(t, dir, path)
	// Create user
	createUser(t, store, models.CreateUserCommand{
		DefaultOrgRole: string(models.ROLE_ADMIN),
		Password:       "admin",
		Login:          "admin",
	})

	t.Run("when quota limit doesn't exceed, importing a dashboard should succeed", func(t *testing.T) {
		// Import dashboard
		dashboardDataOne, err := simplejson.NewJson([]byte(`{"title":"just testing"}`))
		require.NoError(t, err)
		buf1 := &bytes.Buffer{}
		err = json.NewEncoder(buf1).Encode(dtos.ImportDashboardCommand{
			Dashboard: dashboardDataOne,
		})
		require.NoError(t, err)
		u := fmt.Sprintf("http://admin:admin@%s/api/dashboards/import", grafanaListedAddr)
		// nolint:gosec
		resp, err := http.Post(u, "application/json", buf1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		t.Cleanup(func() {
			err := resp.Body.Close()
			require.NoError(t, err)
		})
		b, err := ioutil.ReadAll(resp.Body)
		require.NoError(t, err)
		dashboardDTO := &plugins.PluginDashboardInfoDTO{}
		err = json.Unmarshal(b, dashboardDTO)
		require.NoError(t, err)
		require.EqualValues(t, 1, dashboardDTO.DashboardId)
	})

	t.Run("when quota limit exceeds importing a dashboard should fail", func(t *testing.T) {
		dashboardDataOne, err := simplejson.NewJson([]byte(`{"title":"just testing"}`))
		require.NoError(t, err)
		buf1 := &bytes.Buffer{}
		err = json.NewEncoder(buf1).Encode(dtos.ImportDashboardCommand{
			Dashboard: dashboardDataOne,
		})
		require.NoError(t, err)
		u := fmt.Sprintf("http://admin:admin@%s/api/dashboards/import", grafanaListedAddr)
		// nolint:gosec
		resp, err := http.Post(u, "application/json", buf1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
		t.Cleanup(func() {
			err := resp.Body.Close()
			require.NoError(t, err)
		})
		b, err := ioutil.ReadAll(resp.Body)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
		require.JSONEq(t, `{"message":"Quota reached"}`, string(b))
	})
}

func createUser(t *testing.T, store *sqlstore.SQLStore, cmd models.CreateUserCommand) int64 {
	t.Helper()
	u, err := store.CreateUser(context.Background(), cmd)
	require.NoError(t, err)
	return u.Id
}

func TestProvisionioningDashboards(t *testing.T) {
	// Setup Grafana and its Database
	dir, path := testinfra.CreateGrafDir(t, testinfra.GrafanaOpts{
		DisableAnonymous: true,
	})

	provDashboardsDir := filepath.Join(dir, "conf", "provisioning", "dashboards")
	provDashboardsCfg := filepath.Join(provDashboardsDir, "dev.yaml")
	blob := []byte(fmt.Sprintf(`
apiVersion: 1

providers:
- name: 'provisioned dashboards'
  type: file
  allowUiUpdates: false
  options:
   path: %s`, provDashboardsDir))
	err := os.WriteFile(provDashboardsCfg, blob, 0644)
	require.NoError(t, err)
	input, err := ioutil.ReadFile(filepath.Join("./home.json"))
	require.NoError(t, err)
	provDashboardFile := filepath.Join(provDashboardsDir, "home.json")
	err = ioutil.WriteFile(provDashboardFile, input, 0644)
	require.NoError(t, err)
	grafanaListedAddr, store := testinfra.StartGrafana(t, dir, path)
	// Create user
	createUser(t, store, models.CreateUserCommand{
		DefaultOrgRole: string(models.ROLE_ADMIN),
		Password:       "admin",
		Login:          "admin",
	})

	type errorResponseBody struct {
		Message string `json:"message"`
	}

	t.Run("when provisioned directory is not empty, dashboard should be created", func(t *testing.T) {
		title := "Grafana Dev Overview & Home"
		u := fmt.Sprintf("http://admin:admin@%s/api/search?query=%s", grafanaListedAddr, url.QueryEscape(title))
		// nolint:gosec
		resp, err := http.Get(u)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		t.Cleanup(func() {
			err := resp.Body.Close()
			require.NoError(t, err)
		})
		b, err := ioutil.ReadAll(resp.Body)
		require.NoError(t, err)
		dashboardList := &search.HitList{}
		err = json.Unmarshal(b, dashboardList)
		require.NoError(t, err)
		assert.Equal(t, 1, dashboardList.Len())
		var dashboardUID string
		var dashboardID int64
		for _, d := range *dashboardList {
			dashboardUID = d.UID
			dashboardID = d.ID
		}
		assert.Equal(t, int64(1), dashboardID)

		testCases := []struct {
			desc          string
			dashboardData string
		}{
			{
				desc:          "when updating provisioned dashboard using ID it should fail",
				dashboardData: fmt.Sprintf(`{"title":"just testing", "id": %d, "version": 1}`, dashboardID),
			},
			{
				desc:          "when updating provisioned dashboard using UID is should fail",
				dashboardData: fmt.Sprintf(`{"title":"just testing", "uid": %q, "version": 1}`, dashboardUID),
			},
		}
		for _, tc := range testCases {
			t.Run(tc.desc, func(t *testing.T) {
				u := fmt.Sprintf("http://admin:admin@%s/api/dashboards/db", grafanaListedAddr)
				// nolint:gosec
				dashboardData, err := simplejson.NewJson([]byte(tc.dashboardData))
				require.NoError(t, err)
				buf := &bytes.Buffer{}
				err = json.NewEncoder(buf).Encode(models.SaveDashboardCommand{
					Dashboard: dashboardData,
				})
				require.NoError(t, err)

				// nolint:gosec
				resp, err := http.Post(u, "application/json", buf)
				require.NoError(t, err)
				assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
				t.Cleanup(func() {
					err := resp.Body.Close()
					require.NoError(t, err)
				})
				b, err := ioutil.ReadAll(resp.Body)
				require.NoError(t, err)
				dashboardErr := &errorResponseBody{}
				err = json.Unmarshal(b, dashboardErr)
				require.NoError(t, err)
				assert.Equal(t, models.ErrDashboardCannotSaveProvisionedDashboard.Reason, dashboardErr.Message)
			})
		}

		t.Run("deleting provisioned dashboard should fail", func(t *testing.T) {
			u := fmt.Sprintf("http://admin:admin@%s/api/dashboards/uid/%s", grafanaListedAddr, dashboardUID)
			req, err := http.NewRequest("DELETE", u, nil)
			if err != nil {
				fmt.Println(err)
				return
			}

			client := &http.Client{}
			resp, err := client.Do(req)
			require.NoError(t, err)
			t.Cleanup(func() {
				err := resp.Body.Close()
				require.NoError(t, err)
			})
			assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

			b, err := ioutil.ReadAll(resp.Body)
			require.NoError(t, err)
			dashboardErr := &errorResponseBody{}
			err = json.Unmarshal(b, dashboardErr)
			require.NoError(t, err)
			assert.Equal(t, models.ErrDashboardCannotDeleteProvisionedDashboard.Reason, dashboardErr.Message)
		})
	})
}
