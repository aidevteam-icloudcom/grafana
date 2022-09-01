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
	// SQLite has a limit of 999 variables per write. We use 9 per row, so we split up our writes into separate upsert statements.
	err := st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		keysPerRow := 9
		maxRows := 20

		// Prepare the statement to bind each argument to.
		bigUpsertSQL, err := st.SQLStore.Dialect.UpsertMultipleSQL(
			"alert_instance",
			[]string{"rule_org_id", "rule_uid", "labels_hash"},
			[]string{"rule_org_id", "rule_uid", "labels", "labels_hash", "current_state", "current_reason", "current_state_since", "current_state_end", "last_eval_time"},
			maxRows)
		if err != nil {
			return err
		}

		bigStmt, err := sess.DB().Prepare(bigUpsertSQL)
		if err != nil {
			return err
		}

		maxArgs := maxRows * keysPerRow
		args := make([]interface{}, 0, maxArgs)
		for _, alertInstance := range cmd {
			if len(args) >= maxArgs {
				_, err = bigStmt.ExecContext(ctx, args...)
				if err != nil {
					return err
				}
				args = args[:0]
			}

			labelTupleJSON, err := alertInstance.Labels.StringKey()
			if err != nil {
				return err
			}

			if err := models.ValidateAlertInstance(alertInstance); err != nil {
				return err
			}

			args = append(args,
				alertInstance.RuleOrgID, alertInstance.RuleUID, labelTupleJSON, alertInstance.LabelsHash,
				alertInstance.CurrentState, alertInstance.CurrentReason, alertInstance.CurrentStateSince.Unix(),
				alertInstance.CurrentStateEnd.Unix(), alertInstance.LastEvalTime.Unix())
		}

		if len(args) >= 0 {
			upsertSQL, err := st.SQLStore.Dialect.UpsertMultipleSQL(
				"alert_instance",
				[]string{"rule_org_id", "rule_uid", "labels_hash"},
				[]string{"rule_org_id", "rule_uid", "labels", "labels_hash", "current_state", "current_reason", "current_state_since", "current_state_end", "last_eval_time"},
				len(args)/keysPerRow)
			if err != nil {
				return err
			}

			stmt, err := sess.DB().Prepare(upsertSQL)
			if err != nil {
				return err
			}

			_, err = stmt.ExecContext(ctx, args...)
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

// DeleteAlertInstances deletes instances with the provided keys in a single transaction.
func (st DBstore) DeleteAlertInstances(ctx context.Context, keys ...models.AlertInstanceKey) error {
	if len(keys) == 0 {
		return nil
	}

	type data struct {
		ruleOrgID   int64
		ruleUID     string
		labelHashes []interface{}
	}

	maxRows := 200
	rowData := data{
		0, "", make([]interface{}, 0, maxRows),
	}
	placeholderArray := strings.Builder{}
	placeholderArray.WriteString("(")

	execQuery := func(rd data, s *sqlstore.DBSession) error {
		if len(rd.labelHashes) == 0 {
			return nil
		}

		hashPlaceHolders := placeholderArray.String()
		hashPlaceHolders = strings.TrimRight(hashPlaceHolders, ", ")
		hashPlaceHolders = hashPlaceHolders + ")"

		queryString := fmt.Sprintf(
			"DELETE FROM alert_instance WHERE rule_org_id = ? AND rule_uid = ? AND labels_hash IN %s;",
			hashPlaceHolders,
		)

		execArgs := make([]interface{}, 0, 3+len(rd.labelHashes))
		execArgs = append(execArgs, queryString, rd.ruleOrgID, rd.ruleUID)
		execArgs = append(execArgs, rd.labelHashes...)
		_, err := s.Exec(execArgs...)
		if err != nil {
			return err
		}

		return nil
	}

	err := st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		counter := 0
		for _, k := range keys {
			counter++
			// When a rule ID changes or we hit 200 hashes, issue a statement.
			if rowData.ruleOrgID != k.RuleOrgID || rowData.ruleUID != k.RuleUID || len(rowData.labelHashes) >= 200 {
				err := execQuery(rowData, sess)
				if err != nil {
					return err
				}

				// reset our reused data.
				rowData.ruleOrgID = k.RuleOrgID
				rowData.ruleUID = k.RuleUID
				rowData.labelHashes = rowData.labelHashes[:0]
				placeholderArray.Reset()
				placeholderArray.WriteString("(")
			}

			// Accumulate new values.
			rowData.labelHashes = append(rowData.labelHashes, k.LabelsHash)
			placeholderArray.WriteString("?, ")
		}

		// Delete any remaining rows.
		if len(rowData.labelHashes) != 0 {
			err := execQuery(rowData, sess)
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
