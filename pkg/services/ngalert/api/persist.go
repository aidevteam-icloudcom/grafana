package api

import (
	"context"

	"github.com/grafana/grafana/pkg/models"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/store"
	"github.com/grafana/grafana/pkg/services/user"
)

type RuleStore interface {
	GetUserVisibleNamespaces(context.Context, int64, *user.SignedInUser) (map[string]*models.Folder, error)
	GetNamespaceByTitle(context.Context, string, int64, *user.SignedInUser, bool) (*models.Folder, error)
	GetAlertRulesGroupByRuleUID(ctx context.Context, query *ngmodels.GetAlertRulesGroupByRuleUIDQuery) error
	ListAlertRules(ctx context.Context, query *ngmodels.ListAlertRulesQuery) error

	// InsertAlertRules will insert all alert rules passed into the function
	// and return the map of uuid to id.
	InsertAlertRules(ctx context.Context, rule []ngmodels.AlertRule) (map[string]int64, error)
	UpdateAlertRules(ctx context.Context, rule []store.UpdateRule) error
	DeleteAlertRulesByUID(ctx context.Context, orgID int64, ruleUID ...string) error
}
