package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/services/cloudmigration"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/web"
)

type CloudMigrationAPI struct {
	cloudMigrationsService cloudmigration.Service
	routeRegister          routing.RouteRegister
	log                    log.Logger
	tracer                 tracing.Tracer
}

func RegisterApi(
	rr routing.RouteRegister,
	cms cloudmigration.Service,
	tracer tracing.Tracer,
) *CloudMigrationAPI {
	api := &CloudMigrationAPI{
		log:                    log.New("cloudmigrations.api"),
		routeRegister:          rr,
		cloudMigrationsService: cms,
		tracer:                 tracer,
	}
	api.registerEndpoints()
	return api
}

// RegisterAPIEndpoints Registers Endpoints on Grafana Router
func (cma *CloudMigrationAPI) registerEndpoints() {
	cma.routeRegister.Group("/api/cloudmigration", func(cloudMigrationRoute routing.RouteRegister) {
		// migration
		cloudMigrationRoute.Get("/migration", routing.Wrap(cma.GetMigrationList))
		cloudMigrationRoute.Post("/migration", routing.Wrap(cma.CreateMigration))
		cloudMigrationRoute.Get("/migration/:id", routing.Wrap(cma.GetMigration))
		cloudMigrationRoute.Delete("migration/:id", routing.Wrap(cma.DeleteMigration))
		cloudMigrationRoute.Post("/migration/:id/run", routing.Wrap(cma.RunMigration))
		cloudMigrationRoute.Get("/migration/:id/run", routing.Wrap(cma.GetMigrationRunList))
		cloudMigrationRoute.Get("/migration/:id/run/:runID", routing.Wrap(cma.GetMigrationRun))
		cloudMigrationRoute.Post("/token", routing.Wrap(cma.CreateToken))
	}, middleware.ReqGrafanaAdmin)
}

func (cma *CloudMigrationAPI) CreateToken(c *contextmodel.ReqContext) response.Response {
	ctx, span := cma.tracer.Start(c.Req.Context(), "MigrationAPI.CreateAccessToken")
	defer span.End()

	logger := cma.log.FromContext(ctx)

	resp, err := cma.cloudMigrationsService.CreateToken(ctx)
	if err != nil {
		logger.Error("creating gcom access token", "err", err.Error())
		return response.Error(http.StatusInternalServerError, "creating gcom access token", err)
	}

	return response.JSON(http.StatusOK, cloudmigration.CreateAccessTokenResponseDTO(resp))
}

func (cma *CloudMigrationAPI) GetMigrationList(c *contextmodel.ReqContext) response.Response {
	cloudMigrations, err := cma.cloudMigrationsService.GetMigrationList(c.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration list error", err)
	}
	return response.JSON(http.StatusOK, cloudMigrations)
}

func (cma *CloudMigrationAPI) GetMigration(c *contextmodel.ReqContext) response.Response {
	id, err := strconv.ParseInt(web.Params(c.Req)[":id"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "id is invalid", err)
	}
	cloudMigration, err := cma.cloudMigrationsService.GetMigration(c.Req.Context(), id)
	if err != nil {
		return response.Error(http.StatusNotFound, "migration not found", err)
	}
	return response.JSON(http.StatusOK, cloudMigration)
}

func (cma *CloudMigrationAPI) CreateMigration(c *contextmodel.ReqContext) response.Response {
	cmd := cloudmigration.CloudMigrationRequest{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	cloudMigration, err := cma.cloudMigrationsService.CreateMigration(c.Req.Context(), cmd)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration creation error", err)
	}
	return response.JSON(http.StatusOK, cloudMigration)
}

func (cma *CloudMigrationAPI) RunMigration(c *contextmodel.ReqContext) response.Response {
	var items []cloudmigration.MigrateDataResponseItemDTO

	stringID := web.Params(c.Req)[":id"]
	id, err := strconv.ParseInt(stringID, 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "id is invalid", err)
	}
	cmd := cloudmigration.MigrateDataRequestDTO{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	cloudMigrationRun, err := cma.cloudMigrationsService.RunMigration(c.Req.Context(), id)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration run error", err)
	}

	migration, err := cma.cloudMigrationsService.GetMigration(c.Req.Context(), id)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration get error", err)
	}

	// DATASOURCE MIGRATION
	dataSourceMigrationResponse := cloudmigration.MigrateDataResponseItemDTO{
		RefID:  stringID,
		Status: cloudmigration.ItemStatusOK,
	}
	if err := MigrateDataType(cloudmigration.DatasourceDataType, "http://localhost/api/v1/migrate-data", migration.AuthToken, stringID, cloudMigrationRun.DataSources); err != nil {
		dataSourceMigrationResponse.Error = err.Error()
		dataSourceMigrationResponse.Status = cloudmigration.ItemStatusError
	}
	items = append(items, dataSourceMigrationResponse)

	// FOLDER MIGRATION
	folderMigrationResponse := cloudmigration.MigrateDataResponseItemDTO{
		RefID:  stringID,
		Status: cloudmigration.ItemStatusOK,
	}
	if err := MigrateDataType(cloudmigration.FolderDataType, "http://localhost/api/v1/migrate-data", migration.AuthToken, stringID, cloudMigrationRun.Folders); err != nil {
		folderMigrationResponse.Error = err.Error()
		folderMigrationResponse.Status = cloudmigration.ItemStatusError
	}
	items = append(items, folderMigrationResponse)

	// DASHBOARD MIGRATION
	dashboardMigrationResponse := cloudmigration.MigrateDataResponseItemDTO{
		RefID:  stringID,
		Status: cloudmigration.ItemStatusOK,
	}
	if err := MigrateDataType(cloudmigration.DashboardDataType, "http://localhost/api/v1/migrate-data", migration.AuthToken, stringID, cloudMigrationRun.Dashboards); err != nil {
		dashboardMigrationResponse.Error = err.Error()
		dashboardMigrationResponse.Status = cloudmigration.ItemStatusError
	}
	items = append(items, dashboardMigrationResponse)
	result := cloudmigration.MigrateDataResponseDTO{
		Items: items,
	}

	return response.JSON(http.StatusOK, result)
}

func (cma *CloudMigrationAPI) GetMigrationRun(c *contextmodel.ReqContext) response.Response {
	migrationStatus, err := cma.cloudMigrationsService.GetMigrationStatus(c.Req.Context(), web.Params(c.Req)[":id"], web.Params(c.Req)[":runID"])
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration status error", err)
	}
	return response.JSON(http.StatusOK, migrationStatus)
}

func (cma *CloudMigrationAPI) GetMigrationRunList(c *contextmodel.ReqContext) response.Response {
	migrationStatus, err := cma.cloudMigrationsService.GetMigrationStatusList(c.Req.Context(), web.Params(c.Req)[":id"])
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration status error", err)
	}
	return response.JSON(http.StatusOK, migrationStatus)
}

func (cma *CloudMigrationAPI) DeleteMigration(c *contextmodel.ReqContext) response.Response {
	err := cma.cloudMigrationsService.DeleteMigration(c.Req.Context(), web.Params(c.Req)[":id"])
	if err != nil {
		return response.Error(http.StatusInternalServerError, "migration delete error", err)
	}
	return response.Empty(http.StatusOK)
}

func MigrateDataType(dataType cloudmigration.MigrateDataType, url, token, id string, body []byte) error {
	result := cloudmigration.MigrateDataRequestItemDTO{
		Type:  dataType,
		RefID: id,
		Name:  string(dataType),
		Data:  body,
	}
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("json marshal error: %w", err)
	}
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("http request error: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http request error: %w", err)
	}
	resp.Body.Close()
	return nil
}
