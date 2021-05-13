package store

import (
	"context"
	"fmt"

	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var (
	// ErrNoAlertmanagerConfiguration is an error for when no alertmanager configuration is found.
	ErrNoAlertmanagerConfiguration = fmt.Errorf("could not find an Alertmanager configuration")
)

// GetLatestAlertmanagerConfiguration returns the lastest version of the alertmanager configuration.
// It returns ErrNoAlertmanagerConfiguration if no configuration is found.
func (st *DBstore) GetLatestAlertmanagerConfiguration(query *models.GetLatestAlertmanagerConfigurationQuery) error {
	return st.SQLStore.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		c := &models.AlertConfiguration{}
		// The ID is already an auto incremental column, using the ID as an order should guarantee the latest.
		ok, err := sess.Desc("id").Limit(1).Get(c)
		if err != nil {
			return err
		}

		if !ok {
			st.Metrics.ActiveConfigurations.Set(0)
			return ErrNoAlertmanagerConfiguration
		}

		st.Metrics.ActiveConfigurations.Set(1)
		query.Result = c
		return nil
	})
}

// SaveAlertmanagerConfiguration creates an alertmanager configuration.
func (st *DBstore) SaveAlertmanagerConfiguration(cmd *models.SaveAlertmanagerConfigurationCmd) error {
	return st.SQLStore.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		config := models.AlertConfiguration{
			AlertmanagerConfiguration: cmd.AlertmanagerConfiguration,
			ConfigurationVersion:      cmd.ConfigurationVersion,
		}
		if _, err := sess.Insert(config); err != nil {
			return err
		}
		st.Metrics.ActiveConfigurations.Set(1)
		return nil
	})
}
