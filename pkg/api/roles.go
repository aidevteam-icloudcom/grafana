package api

import (
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

// API related actions
const (
	ActionProvisioningReload = "provisioning:reload"

	ActionDatasourcesRead   = "datasources:read"
	ActionDatasourcesQuery  = "datasources:query"
	ActionDatasourcesCreate = "datasources:create"
	ActionDatasourcesWrite  = "datasources:write"
	ActionDatasourcesDelete = "datasources:delete"
	ActionDatasourcesIDRead = "datasources.id:read"

	ActionOrgsRead            = "orgs:read"
	ActionOrgsPreferencesRead = "orgs.preferences:read"
	ActionOrgsQuotasRead      = "orgs.quotas:read"
)

// API related scopes
var (
	ScopeProvisionersAll           = accesscontrol.Scope("provisioners", "*")
	ScopeProvisionersDashboards    = accesscontrol.Scope("provisioners", "dashboards")
	ScopeProvisionersPlugins       = accesscontrol.Scope("provisioners", "plugins")
	ScopeProvisionersDatasources   = accesscontrol.Scope("provisioners", "datasources")
	ScopeProvisionersNotifications = accesscontrol.Scope("provisioners", "notifications")

	ScopeDatasourcesAll = accesscontrol.Scope("datasources", "*")
	ScopeDatasourceID   = accesscontrol.Scope("datasources", "id", accesscontrol.Parameter(":id"))
	ScopeDatasourceUID  = accesscontrol.Scope("datasources", "uid", accesscontrol.Parameter(":uid"))
	ScopeDatasourceName = accesscontrol.Scope("datasources", "name", accesscontrol.Parameter(":name"))

	ScopeOrgsAll      = accesscontrol.Scope("orgs", "*")
	ScopeOrgID        = accesscontrol.Scope("orgs", "id", accesscontrol.Parameter(":orgId"))
	ScopeOrgCurrentID = accesscontrol.Scope("orgs", "id", accesscontrol.Field("OrgID"))
	ScopeOrgName      = accesscontrol.Scope("orgs", "name", accesscontrol.Parameter(":name"))
)

// declareFixedRoles declares to the AccessControl service fixed roles and their
// grants to organization roles ("Viewer", "Editor", "Admin") or "Grafana Admin"
// that HTTPServer needs
func (hs *HTTPServer) declareFixedRoles() error {
	registrations := []accesscontrol.RoleRegistration{
		{
			Role: accesscontrol.RoleDTO{
				Version:     1,
				Name:        "fixed:provisioning:admin",
				Description: "Reload provisioning configurations",
				Permissions: []accesscontrol.Permission{
					{
						Action: ActionProvisioningReload,
						Scope:  ScopeProvisionersAll,
					},
				},
			},
			Grants: []string{accesscontrol.RoleGrafanaAdmin},
		},
		{
			Role: accesscontrol.RoleDTO{
				Version:     1,
				Name:        "fixed:datasources:admin",
				Description: "Gives access to create, read, update, delete datasources",
				Permissions: []accesscontrol.Permission{
					{
						Action: ActionDatasourcesRead,
						Scope:  ScopeDatasourcesAll,
					},
					{
						Action: ActionDatasourcesWrite,
						Scope:  ScopeDatasourcesAll,
					},
					{
						Action: ActionDatasourcesCreate,
					},
					{
						Action: ActionDatasourcesDelete,
						Scope:  ScopeDatasourcesAll,
					},
					{
						Action: ActionDatasourcesQuery,
						Scope:  ScopeDatasourcesAll,
					},
				},
			},
			Grants: []string{string(models.ROLE_ADMIN)},
		},
		{
			Role: accesscontrol.RoleDTO{
				Version:     2,
				Name:        "fixed:datasources:id:viewer",
				Description: "Gives access to read datasources ID",
				Permissions: []accesscontrol.Permission{
					{
						Action: ActionDatasourcesIDRead,
						Scope:  ScopeDatasourcesAll,
					},
				},
			},
			Grants: []string{string(models.ROLE_VIEWER)},
		},
		{
			Role: accesscontrol.RoleDTO{
				Version:     1,
				Name:        "fixed:datasources:compatibility:querier",
				Description: "Query data sources when data source permissions are not in use",
				Permissions: []accesscontrol.Permission{
					{Action: ActionDatasourcesQuery},
				},
			},
			Grants: []string{string(models.ROLE_VIEWER)},
		},
	}

	return hs.AccessControl.DeclareFixedRoles(registrations...)
}

// Evaluators
// here is the list of complex evaluators we use in this package

// dataSourcesConfigurationAccessEvaluator is used to protect the "Configure > Data sources" tab access
var dataSourcesConfigurationAccessEvaluator = accesscontrol.EvalAll(
	accesscontrol.EvalPermission(ActionDatasourcesRead, ScopeDatasourcesAll),
	accesscontrol.EvalAny(
		accesscontrol.EvalPermission(ActionDatasourcesCreate),
		accesscontrol.EvalPermission(ActionDatasourcesDelete),
		accesscontrol.EvalPermission(ActionDatasourcesWrite),
	),
)

// dataSourcesNewAccessEvaluator is used to protect the "Configure > Data sources > New" page access
var dataSourcesNewAccessEvaluator = accesscontrol.EvalAll(
	accesscontrol.EvalPermission(ActionDatasourcesRead, ScopeDatasourcesAll),
	accesscontrol.EvalPermission(ActionDatasourcesCreate),
	accesscontrol.EvalPermission(ActionDatasourcesWrite),
)

// dataSourcesEditAccessEvaluator is used to protect the "Configure > Data sources > Edit" page access
var dataSourcesEditAccessEvaluator = accesscontrol.EvalAll(
	accesscontrol.EvalPermission(ActionDatasourcesRead, ScopeDatasourcesAll),
	accesscontrol.EvalPermission(ActionDatasourcesWrite),
)
