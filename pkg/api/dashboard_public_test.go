package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/query"

	fakeDatasources "github.com/grafana/grafana/pkg/services/datasources/fakes"
)

func TestAPIGetPublicDashboard(t *testing.T) {
	t.Run("It should 404 if featureflag is not enabled", func(t *testing.T) {
		sc := setupHTTPServerWithMockDb(t, false, false, featuremgmt.WithFeatures())
		dashSvc := dashboards.NewFakeDashboardService(t)
		dashSvc.On("GetPublicDashboard", mock.Anything, mock.AnythingOfType("string")).
			Return(&models.Dashboard{}, nil).Maybe()
		sc.hs.dashboardService = dashSvc

		setInitCtxSignedInViewer(sc.initCtx)
		response := callAPI(
			sc.server,
			http.MethodGet,
			"/api/public/dashboards",
			nil,
			t,
		)
		assert.Equal(t, http.StatusNotFound, response.Code)
		response = callAPI(
			sc.server,
			http.MethodGet,
			"/api/public/dashboards/asdf",
			nil,
			t,
		)
		assert.Equal(t, http.StatusNotFound, response.Code)
	})

	dashboardUid := "dashboard-abcd1234"
	pubdashUid := "pubdash-abcd1234"

	testCases := []struct {
		name                  string
		uid                   string
		expectedHttpResponse  int
		publicDashboardResult *models.Dashboard
		publicDashboardErr    error
	}{
		{
			name:                 "It gets a public dashboard",
			uid:                  pubdashUid,
			expectedHttpResponse: http.StatusOK,
			publicDashboardResult: &models.Dashboard{
				Data: simplejson.NewFromAny(map[string]interface{}{
					"Uid": dashboardUid,
				}),
				IsPublic: true,
			},
			publicDashboardErr: nil,
		},
		{
			name:                  "It should return 404 if isPublicDashboard is false",
			uid:                   pubdashUid,
			expectedHttpResponse:  http.StatusNotFound,
			publicDashboardResult: nil,
			publicDashboardErr:    models.ErrPublicDashboardNotFound,
		},
	}

	for _, test := range testCases {
		t.Run(test.name, func(t *testing.T) {
			sc := setupHTTPServerWithMockDb(t, false, false, featuremgmt.WithFeatures(featuremgmt.FlagPublicDashboards))
			dashSvc := dashboards.NewFakeDashboardService(t)
			dashSvc.On("GetPublicDashboard", mock.Anything, mock.AnythingOfType("string")).
				Return(test.publicDashboardResult, test.publicDashboardErr)
			sc.hs.dashboardService = dashSvc

			setInitCtxSignedInViewer(sc.initCtx)
			response := callAPI(
				sc.server,
				http.MethodGet,
				fmt.Sprintf("/api/public/dashboards/%v", test.uid),
				nil,
				t,
			)

			assert.Equal(t, test.expectedHttpResponse, response.Code)

			if test.publicDashboardErr == nil {
				var dashResp dtos.DashboardFullWithMeta
				err := json.Unmarshal(response.Body.Bytes(), &dashResp)
				require.NoError(t, err)

				assert.Equal(t, dashboardUid, dashResp.Dashboard.Get("Uid").MustString())
				assert.Equal(t, true, dashResp.Meta.IsPublic)
				assert.Equal(t, false, dashResp.Meta.CanEdit)
				assert.Equal(t, false, dashResp.Meta.CanDelete)
				assert.Equal(t, false, dashResp.Meta.CanSave)
			} else {
				var errResp struct {
					Error string `json:"error"`
				}
				err := json.Unmarshal(response.Body.Bytes(), &errResp)
				require.NoError(t, err)
				assert.Equal(t, test.publicDashboardErr.Error(), errResp.Error)
			}
		})
	}
}

func TestAPIGetPublicDashboardConfig(t *testing.T) {
	pdc := &models.PublicDashboardConfig{IsPublic: true}

	testCases := []struct {
		name                        string
		dashboardUid                string
		expectedHttpResponse        int
		publicDashboardConfigResult *models.PublicDashboardConfig
		publicDashboardConfigError  error
	}{
		{
			name:                        "retrieves public dashboard config when dashboard is found",
			dashboardUid:                "1",
			expectedHttpResponse:        http.StatusOK,
			publicDashboardConfigResult: pdc,
			publicDashboardConfigError:  nil,
		},
		{
			name:                        "returns 404 when dashboard not found",
			dashboardUid:                "77777",
			expectedHttpResponse:        http.StatusNotFound,
			publicDashboardConfigResult: nil,
			publicDashboardConfigError:  models.ErrDashboardNotFound,
		},
		{
			name:                        "returns 500 when internal server error",
			dashboardUid:                "1",
			expectedHttpResponse:        http.StatusInternalServerError,
			publicDashboardConfigResult: nil,
			publicDashboardConfigError:  errors.New("database broken"),
		},
	}

	for _, test := range testCases {
		t.Run(test.name, func(t *testing.T) {
			sc := setupHTTPServerWithMockDb(t, false, false, featuremgmt.WithFeatures(featuremgmt.FlagPublicDashboards))
			dashSvc := dashboards.NewFakeDashboardService(t)
			dashSvc.On("GetPublicDashboardConfig", mock.Anything, mock.AnythingOfType("int64"), mock.AnythingOfType("string")).
				Return(test.publicDashboardConfigResult, test.publicDashboardConfigError)
			sc.hs.dashboardService = dashSvc

			setInitCtxSignedInViewer(sc.initCtx)
			response := callAPI(
				sc.server,
				http.MethodGet,
				"/api/dashboards/uid/1/public-config",
				nil,
				t,
			)

			assert.Equal(t, test.expectedHttpResponse, response.Code)

			if response.Code == http.StatusOK {
				var pdcResp models.PublicDashboardConfig
				err := json.Unmarshal(response.Body.Bytes(), &pdcResp)
				require.NoError(t, err)
				assert.Equal(t, test.publicDashboardConfigResult, &pdcResp)
			}
		})
	}
}

func TestApiSavePublicDashboardConfig(t *testing.T) {
	testCases := []struct {
		name                  string
		dashboardUid          string
		publicDashboardConfig *models.PublicDashboardConfig
		expectedHttpResponse  int
		saveDashboardError    error
	}{
		{
			name:                  "returns 200 when update persists",
			dashboardUid:          "1",
			publicDashboardConfig: &models.PublicDashboardConfig{IsPublic: true},
			expectedHttpResponse:  http.StatusOK,
			saveDashboardError:    nil,
		},
		{
			name:                  "returns 500 when not persisted",
			expectedHttpResponse:  http.StatusInternalServerError,
			publicDashboardConfig: &models.PublicDashboardConfig{},
			saveDashboardError:    errors.New("backend failed to save"),
		},
		{
			name:                  "returns 404 when dashboard not found",
			expectedHttpResponse:  http.StatusNotFound,
			publicDashboardConfig: &models.PublicDashboardConfig{},
			saveDashboardError:    models.ErrDashboardNotFound,
		},
	}

	for _, test := range testCases {
		t.Run(test.name, func(t *testing.T) {
			sc := setupHTTPServerWithMockDb(t, false, false, featuremgmt.WithFeatures(featuremgmt.FlagPublicDashboards))

			dashSvc := dashboards.NewFakeDashboardService(t)
			dashSvc.On("SavePublicDashboardConfig", mock.Anything, mock.AnythingOfType("*dashboards.SavePublicDashboardConfigDTO")).
				Return(&models.PublicDashboardConfig{IsPublic: true}, test.saveDashboardError)
			sc.hs.dashboardService = dashSvc

			setInitCtxSignedInViewer(sc.initCtx)
			response := callAPI(
				sc.server,
				http.MethodPost,
				"/api/dashboards/uid/1/public-config",
				strings.NewReader(`{ "isPublic": true }`),
				t,
			)

			assert.Equal(t, test.expectedHttpResponse, response.Code)

			// check the result if it's a 200
			if response.Code == http.StatusOK {
				val, err := json.Marshal(test.publicDashboardConfig)
				require.NoError(t, err)
				assert.Equal(t, string(val), response.Body.String())
			}
		})
	}
}

// `/public/dashboards/:uid/query`` endpoint test
func TestAPIQueryPublicDashboard(t *testing.T) {
	queryReturnsError := false

	qds := query.ProvideService(
		nil,
		&fakeDatasources.FakeCacheService{
			DataSources: []*models.DataSource{
				{Uid: "mysqlds"},
				{Uid: "promds"},
			},
		},
		nil,
		&fakePluginRequestValidator{},
		&fakeDatasources.FakeDataSourceService{},
		&fakePluginClient{
			QueryDataHandlerFunc: func(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
				if queryReturnsError {
					return nil, errors.New("error")
				}

				resp := backend.Responses{
					"A": backend.DataResponse{
						Frames: []*data.Frame{
							{
								RefID: "A",
								Name:  "potato",
							},
						},
					},
				}
				return &backend.QueryDataResponse{Responses: resp}, nil
			},
		},
		&fakeOAuthTokenService{},
	)

	fakeDashboardService := &dashboards.FakeDashboardService{}

	serverFeatureEnabled := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.queryDataService = qds
		hs.Features = featuremgmt.WithFeatures(featuremgmt.FlagPublicDashboards, true)
		hs.dashboardService = fakeDashboardService
	})
	serverFeatureDisabled := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.queryDataService = qds
		hs.Features = featuremgmt.WithFeatures(featuremgmt.FlagPublicDashboards, false)
		hs.dashboardService = fakeDashboardService
	})

	t.Run("Status code is 404 when feature toggle is disabled", func(t *testing.T) {
		req := serverFeatureDisabled.NewPostRequest(
			"/api/public/dashboards/abc123/panels/2/query",
			strings.NewReader("{}"),
		)
		resp, err := serverFeatureDisabled.SendJSON(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("Status code is 400 when the panel ID is invalid", func(t *testing.T) {
		req := serverFeatureEnabled.NewPostRequest(
			"/api/public/dashboards/abc123/panels/notanumber/query",
			strings.NewReader("{}"),
		)
		resp, err := serverFeatureDisabled.SendJSON(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Returns query data when feature toggle is enabled", func(t *testing.T) {
		fakeDashboardService.On(
			"BuildPublicDashboardMetricRequest",
			mock.Anything,
			"abc123",
			int64(2),
		).Return(dtos.MetricRequest{
			Queries: []*simplejson.Json{
				simplejson.MustJson([]byte(`
					{
					  "datasource": {
						"type": "prometheus",
						"uid": "promds"
					  },
					  "exemplar": true,
					  "expr": "query_2_A",
					  "interval": "",
					  "legendFormat": "",
					  "refId": "A"
					}
				`)),
			},
		}, nil)
		req := serverFeatureEnabled.NewPostRequest(
			"/api/public/dashboards/abc123/panels/2/query",
			strings.NewReader("{}"),
		)
		resp, err := serverFeatureEnabled.SendJSON(req)
		require.NoError(t, err)
		bodyBytes, err := ioutil.ReadAll(resp.Body)
		require.JSONEq(
			t,
			`{
				"results": {
					"A": {
						"frames": [
							{
								"data": {
									"values": []
								},
								"schema": {
									"fields": [],
									"refId": "A",
									"name": "potato"
								}
							}
						]
					}
				}
			}`,
			string(bodyBytes),
		)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("Status code is 500 when the query fails", func(t *testing.T) {
		fakeDashboardService.On(
			"BuildPublicDashboardMetricRequest",
			mock.Anything,
			"abc123",
			int64(2),
		).Return(dtos.MetricRequest{
			Queries: []*simplejson.Json{
				simplejson.MustJson([]byte(`
					{
					  "datasource": {
						"type": "prometheus",
						"uid": "promds"
					  },
					  "exemplar": true,
					  "expr": "query_2_A",
					  "interval": "",
					  "legendFormat": "",
					  "refId": "A"
					}
				`)),
			},
		}, nil)
		req := serverFeatureEnabled.NewPostRequest(
			"/api/public/dashboards/abc123/panels/2/query",
			strings.NewReader("{}"),
		)
		queryReturnsError = true
		resp, err := serverFeatureDisabled.SendJSON(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusInternalServerError, resp.StatusCode)
		queryReturnsError = false
	})

	t.Run("Status code is 200 when a panel has queries from multiple datasources", func(t *testing.T) {
		t.Skip("multiple datasources not yet supported")
		fakeDashboardService.On(
			"BuildPublicDashboardMetricRequest",
			mock.Anything,
			mock.Anything,
		).Return(dtos.MetricRequest{}, nil)
		req := serverFeatureEnabled.NewPostRequest(
			"/api/public/dashboards/abc123/panels/2/query",
			strings.NewReader("{}"),
		)
		resp, err := serverFeatureEnabled.SendJSON(req)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
		require.Equal(t, http.StatusOK, resp.StatusCode)
	})
}
