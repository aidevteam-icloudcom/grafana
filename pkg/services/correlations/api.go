package correlations

import (
	"errors"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/datasources"

	"github.com/grafana/grafana/pkg/web"
)

func (s *CorrelationsService) registerAPIEndpoints() {
	uidScope := datasources.ScopeProvider.GetResourceScopeUID(ac.Parameter(":uid"))
	authorize := ac.Middleware(s.AccessControl)

	s.RouteRegister.Group("/api/datasources/uid/:uid/correlations", func(entities routing.RouteRegister) {
		entities.Post("/", middleware.ReqSignedIn, authorize(ac.ReqOrgAdmin, ac.EvalPermission(datasources.ActionWrite, uidScope)), routing.Wrap(s.createHandler))
	})
}

// swagger:route POST /datasources/uid/{sourceUID}/correlations correlations createCorrelation
//
// Add correlation.
//
// Responses:
// 200: createCorrelationResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError
func (s *CorrelationsService) createHandler(c *models.ReqContext) response.Response {
	cmd := CreateCorrelationCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	cmd.SourceUID = web.Params(c.Req)[":uid"]
	cmd.OrgId = c.OrgId

	correlation, err := s.CreateCorrelation(c.Req.Context(), cmd)
	if err != nil {
		if errors.Is(err, ErrSourceDataSourceDoesNotExists) || errors.Is(err, ErrTargetDataSourceDoesNotExists) {
			return response.Error(http.StatusNotFound, "Data source not found", err)
		}

		if errors.Is(err, ErrSourceDataSourceReadOnly) {
			return response.Error(http.StatusForbidden, "Data source is read only", err)
		}

		return response.Error(http.StatusInternalServerError, "Failed to add correlation", err)
	}

	return response.JSON(http.StatusOK, CreateCorrelationResponseBody{Result: correlation, Message: "Correlation created"})
}

// swagger:parameters createCorrelation
type CreateCorrelationParams struct {
	// in:body
	// required:true
	Body CreateCorrelationCommand `json:"body"`
	// in:path
	// required:true
	SourceUID string `json:"sourceUID"`
}

//swagger:response createCorrelationResponse
type CreateCorrelationResponse struct {
	// in: body
	Body CreateCorrelationResponseBody `json:"body"`
}
