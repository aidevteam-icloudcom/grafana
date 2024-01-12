package authorizer

import (
	"context"
	"fmt"

	"k8s.io/apiserver/pkg/authorization/authorizer"

	"github.com/grafana/grafana/pkg/infra/appcontext"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/org"
)

var _ authorizer.Authorizer = &orgRoleAuthorizer{}

type orgRoleAuthorizer struct {
	log log.Logger
}

func newOrgRoleAuthorizer(orgService org.Service) *orgRoleAuthorizer {
	return &orgRoleAuthorizer{log: log.New("grafana-apiserver.authorizer.orgrole")}
}

func (auth orgRoleAuthorizer) Authorize(ctx context.Context, a authorizer.Attributes) (authorized authorizer.Decision, reason string, err error) {
	signedInUser, err := appcontext.User(ctx)
	if err != nil {
		return authorizer.DecisionDeny, fmt.Sprintf("error getting signed in user: %v", err), nil
	}

	switch signedInUser.OrgRole {
	case org.RoleAdmin:
		return authorizer.DecisionAllow, "", nil
	case org.RoleEditor:
		switch a.GetVerb() {
		case "get", "list", "watch", "create", "update", "patch", "delete", "put", "post":
			return authorizer.DecisionAllow, "", nil
		default:
			return authorizer.DecisionDeny, errorMessageForGrafanaOrgRole(string(signedInUser.OrgRole), a), nil
		}
	case org.RoleViewer:
		switch a.GetVerb() {
		case "get", "list", "watch":
			return authorizer.DecisionAllow, "", nil
		default:
			return authorizer.DecisionDeny, errorMessageForGrafanaOrgRole(string(signedInUser.OrgRole), a), nil
		}
	case org.RoleNone:
		return authorizer.DecisionDeny, errorMessageForGrafanaOrgRole(string(signedInUser.OrgRole), a), nil
	}
	return authorizer.DecisionDeny, "", nil
}

func errorMessageForGrafanaOrgRole(grafanaOrgRole string, a authorizer.Attributes) string {
	return fmt.Sprintf("Grafana org role (%s) didn't allow %s access on requested resource=%s, path=%s", grafanaOrgRole, a.GetVerb(), a.GetResource(), a.GetPath())
}
