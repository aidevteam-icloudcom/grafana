package validation

import (
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	publicdashboardModels "github.com/grafana/grafana/pkg/services/publicdashboards/models"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestValidateSavePublicDashboard(t *testing.T) {
	t.Run("Returns validation error when dto has no dashboard uid", func(t *testing.T) {
		dashboard := models.NewDashboard("dashboardTitle")
		dto := &publicdashboardModels.SavePublicDashboardConfigDTO{DashboardUid: "", OrgId: 1, UserId: 1, PublicDashboard: nil}

		err := ValidateSavePublicDashboard(dto, dashboard)
		require.ErrorContains(t, err, "Unique identifier needed to be able to get a dashboard")
	})

	t.Run("Returns no validation error when dto has dashboard uid", func(t *testing.T) {
		dashboard := models.NewDashboard("dashboardTitle")
		dto := &publicdashboardModels.SavePublicDashboardConfigDTO{DashboardUid: "abc123", OrgId: 1, UserId: 1, PublicDashboard: nil}

		err := ValidateSavePublicDashboard(dto, dashboard)
		require.NoError(t, err)
	})

	t.Run("Returns validation error when dashboard has template variables", func(t *testing.T) {
		templateVars := []byte(`{
			"templating": {
				 "list": [
				   {
					  "name": "templateVariableName"
				   }
				]
			}
		}`)
		dashboardData, _ := simplejson.NewJson(templateVars)
		dashboard := models.NewDashboardFromJson(dashboardData)
		dto := &publicdashboardModels.SavePublicDashboardConfigDTO{DashboardUid: "abc123", OrgId: 1, UserId: 1, PublicDashboard: nil}

		err := ValidateSavePublicDashboard(dto, dashboard)
		require.ErrorContains(t, err, "Public dashboard has template variables")
	})

	t.Run("Returns no validation error when dashboard has no template variables", func(t *testing.T) {
		templateVars := []byte(`{
			"templating": {
				 "list": []
			}
		}`)
		dashboardData, _ := simplejson.NewJson(templateVars)
		dashboard := models.NewDashboardFromJson(dashboardData)
		dto := &publicdashboardModels.SavePublicDashboardConfigDTO{DashboardUid: "abc123", OrgId: 1, UserId: 1, PublicDashboard: nil}

		err := ValidateSavePublicDashboard(dto, dashboard)
		require.NoError(t, err)
	})
}
