package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

type InstanceStore interface {
	GetAlertInstance(ctx context.Context, cmd *models.GetAlertInstanceQuery) error
	ListAlertInstances(ctx context.Context, cmd *models.ListAlertInstancesQuery) error
	SaveAlertInstances(ctx context.Context, cmd ...models.AlertInstance) error
	FetchOrgIds(ctx context.Context) ([]int64, error)
	DeleteAlertInstances(ctx context.Context, keys ...models.AlertInstanceKey) error
	DeleteAlertInstancesByRule(ctx context.Context, key models.AlertRuleKey) error
}

// GetAlertInstance is a handler for retrieving an alert instance based on OrgId, AlertDefintionID, and
// the hash of the labels.
func (st DBstore) GetAlertInstance(ctx context.Context, cmd *models.GetAlertInstanceQuery) error {
	return st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		instance := models.AlertInstance{}
		s := strings.Builder{}
		s.WriteString(`SELECT * FROM alert_instance
			WHERE
				rule_org_id=? AND
				rule_uid=? AND
				labels_hash=?
		`)

		_, hash, err := cmd.Labels.StringAndHash()
		if err != nil {
			return err
		}

		params := append(make([]interface{}, 0), cmd.RuleOrgID, cmd.RuleUID, hash)

		has, err := sess.SQL(s.String(), params...).Get(&instance)
		if !has {
			return fmt.Errorf("instance not found for labels %v (hash: %v), alert rule %v (org %v)", cmd.Labels, hash, cmd.RuleUID, cmd.RuleOrgID)
		}
		if err != nil {
			return err
		}

		cmd.Result = &instance
		return nil
	})
}

// ListAlertInstances is a handler for retrieving alert instances within specific organisation
// based on various filters.
func (st DBstore) ListAlertInstances(ctx context.Context, cmd *models.ListAlertInstancesQuery) error {
	return st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		alertInstances := make([]*models.AlertInstance, 0)

		s := strings.Builder{}
		params := make([]interface{}, 0)

		addToQuery := func(stmt string, p ...interface{}) {
			s.WriteString(stmt)
			params = append(params, p...)
		}

		addToQuery("SELECT * FROM alert_instance WHERE rule_org_id = ?", cmd.RuleOrgID)

		if cmd.RuleUID != "" {
			addToQuery(` AND rule_uid = ?`, cmd.RuleUID)
		}

		if cmd.State != "" {
			addToQuery(` AND current_state = ?`, cmd.State)
		}

		if cmd.StateReason != "" {
			addToQuery(` AND current_reason = ?`, cmd.StateReason)
		}

		if err := sess.SQL(s.String(), params...).Find(&alertInstances); err != nil {
			return err
		}

		cmd.Result = alertInstances
		return nil
	})
}

// SaveAlertInstances saves all the provided alert instances to the store. It
// writes transactions with a maximum count of 400 rows. Larger writes are
// split into multiple transactions.
func (st DBstore) SaveAlertInstances(ctx context.Context, cmd ...models.AlertInstance) error {
	// SQLite has a max 999 variable limit per statement. We use almost 9 per
	// row, so we split our writes into fewer prepared statements using the row
	// limit.
	err := st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		// Prepare the statement to bind each argument to.
		upsertSQL := st.SQLStore.Dialect.UpsertSQL(
			"alert_instance",
			[]string{"rule_org_id", "rule_uid", "labels_hash"},
			[]string{"rule_org_id", "rule_uid", "labels", "labels_hash", "current_state", "current_reason", "current_state_since", "current_state_end", "last_eval_time"})
		stmt, err := sess.DB().Prepare(upsertSQL)
		if err != nil {
			return err
		}

		for _, alertInstance := range cmd {
			labelTupleJSON, err := alertInstance.Labels.StringKey()
			if err != nil {
				return err
			}

			if err := models.ValidateAlertInstance(alertInstance); err != nil {
				return err
			}

			_, err = stmt.ExecContext(ctx,
				alertInstance.RuleOrgID, alertInstance.RuleUID, labelTupleJSON, alertInstance.LabelsHash,
				alertInstance.CurrentState, alertInstance.CurrentReason, alertInstance.CurrentStateSince.Unix(),
				alertInstance.CurrentStateEnd.Unix(), alertInstance.LastEvalTime.Unix())
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	return nil
}

func (st DBstore) FetchOrgIds(ctx context.Context) ([]int64, error) {
	orgIds := []int64{}

	err := st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		s := strings.Builder{}
		params := make([]interface{}, 0)

		addToQuery := func(stmt string, p ...interface{}) {
			s.WriteString(stmt)
			params = append(params, p...)
		}

		addToQuery("SELECT DISTINCT rule_org_id FROM alert_instance")

		if err := sess.SQL(s.String(), params...).Find(&orgIds); err != nil {
			return err
		}
		return nil
	})

	return orgIds, err
}

// DeleteAlertInstances deletes instances with the provided keys. It
// writes transactions with a maximum count of 400 rows. Larger writes are
// split into multiple transactions.
func (st DBstore) DeleteAlertInstances(ctx context.Context, keys ...models.AlertInstanceKey) error {
	if len(keys) == 0 {
		return nil
	}

	err := st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		for _, k := range keys {
			_, err := sess.Exec("DELETE FROM alert_instance WHERE rule_org_id = ? AND rule_uid = ? AND labels_hash = ?",
				k.RuleOrgID, k.RuleUID, k.LabelsHash)
			if err != nil {
				return err
			}
		}
		return nil
	})

	return err
}

func (st DBstore) DeleteAlertInstancesByRule(ctx context.Context, key models.AlertRuleKey) error {
	return st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Exec("DELETE FROM alert_instance WHERE rule_org_id = ? AND rule_uid = ?", key.OrgID, key.UID)
		return err
	})
}
