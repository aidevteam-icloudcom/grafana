package ualert

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"xorm.io/xorm"

	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

const GENERAL_FOLDER = "General Alerting"

// FOLDER_CREATED_BY us used to track folders created by this migration
// during alert migration cleanup.
const FOLDER_CREATED_BY = -8

var migTitle = "move dashboard alerts to unified alerting"

const codeMigration = "code migration"

type MigrationError struct {
	AlertId int64
	Err     error
}

func (e MigrationError) Error() string {
	return fmt.Sprintf("failed to migrate alert %d: %s", e.AlertId, e.Err.Error())
}

func (e *MigrationError) Unwrap() error { return e.Err }

// RerunDashAlertMigration force the dashboard alert migration to run
// to make sure that the Alertmanager configurations will be created for each organisation
func RerunDashAlertMigration(mg *migrator.Migrator) {
	logs, err := mg.GetMigrationLog()
	if err != nil {
		mg.Logger.Error("Alert migration failure: could not get migration log", "error", err)
		os.Exit(1)
	}

	cloneMigTitle := fmt.Sprintf("clone %s", migTitle)

	_, migrationRun := logs[cloneMigTitle]
	ngEnabled := mg.Cfg.UnifiedAlerting.IsEnabled()

	switch {
	case ngEnabled && !migrationRun:
		// The only use of this migration is when a user enabled ng-alerting before 8.2.
		mg.AddMigration(cloneMigTitle, &upgradeNgAlerting{})
		// if user disables the feature flag and enables it back.
		// This migration does not need to be run because the original migration AddDashAlertMigration does what's needed
	}
}

func AddDashboardUIDPanelIDMigration(mg *migrator.Migrator) {
	logs, err := mg.GetMigrationLog()
	if err != nil {
		mg.Logger.Error("Alert migration failure: could not get migration log", "error", err)
		os.Exit(1)
	}

	migrationID := "update dashboard_uid and panel_id from existing annotations"
	_, migrationRun := logs[migrationID]
	ngEnabled := mg.Cfg.UnifiedAlerting.IsEnabled()
	undoMigrationID := "undo " + migrationID

	if ngEnabled && !migrationRun {
		// If ngalert is enabled and the migration has not been run then run it.
		mg.AddMigration(migrationID, &updateDashboardUIDPanelIDMigration{})
	} else if !ngEnabled && migrationRun {
		// If ngalert is disabled and the migration has been run then remove it
		// from the migration log so it will run if ngalert is re-enabled.
		mg.AddMigration(undoMigrationID, &clearMigrationEntry{
			migrationID: migrationID,
		})
	}
}

// updateDashboardUIDPanelIDMigration sets the dashboard_uid and panel_id columns
// from the __dashboardUid__ and __panelId__ annotations.
type updateDashboardUIDPanelIDMigration struct {
	migrator.MigrationBase
}

func (m *updateDashboardUIDPanelIDMigration) SQL(_ migrator.Dialect) string {
	return "set dashboard_uid and panel_id migration"
}

func (m *updateDashboardUIDPanelIDMigration) Exec(sess *xorm.Session, mg *migrator.Migrator) error {
	var results []struct {
		ID          int64             `xorm:"id"`
		Annotations map[string]string `xorm:"annotations"`
	}
	if err := sess.SQL(`SELECT id, annotations FROM alert_rule`).Find(&results); err != nil {
		return fmt.Errorf("failed to get annotations for all alert rules: %w", err)
	}
	for _, next := range results {
		var (
			dashboardUID *string
			panelID      *int64
		)
		if s, ok := next.Annotations[ngmodels.DashboardUIDAnnotation]; ok {
			dashboardUID = &s
		}
		if s, ok := next.Annotations[ngmodels.PanelIDAnnotation]; ok {
			i, err := strconv.ParseInt(s, 10, 64)
			if err != nil {
				return fmt.Errorf("the %s annotation does not contain a valid Panel ID: %w", ngmodels.PanelIDAnnotation, err)
			}
			panelID = &i
		}
		// We do not want to set panel_id to a non-nil value when dashboard_uid is nil
		// as panel_id is not unique and so cannot be queried without its dashboard_uid.
		// This can happen where users have deleted the dashboard_uid annotation but kept
		// the panel_id annotation.
		if dashboardUID != nil {
			if _, err := sess.Exec(`UPDATE alert_rule SET dashboard_uid = ?, panel_id = ? WHERE id = ?`,
				dashboardUID,
				panelID,
				next.ID); err != nil {
				return fmt.Errorf("failed to set dashboard_uid and panel_id for alert rule: %w", err)
			}
		}
	}
	return nil
}

// clearMigrationEntry removes an entry fromt the migration_log table.
// This migration is not recorded in the migration_log so that it can re-run several times.
type clearMigrationEntry struct {
	migrator.MigrationBase

	migrationID string
}

func (m *clearMigrationEntry) SQL(dialect migrator.Dialect) string {
	return "clear migration entry code migration"
}

func (m *clearMigrationEntry) Exec(sess *xorm.Session, mg *migrator.Migrator) error {
	_, err := sess.SQL(`DELETE from migration_log where migration_id = ?`, m.migrationID).Query()
	if err != nil {
		return fmt.Errorf("failed to clear migration entry %v: %w", m.migrationID, err)
	}
	return nil
}

func (m *clearMigrationEntry) SkipMigrationLog() bool {
	return true
}

type AlertConfiguration struct {
	ID    int64 `xorm:"pk autoincr 'id'"`
	OrgID int64 `xorm:"org_id"`

	AlertmanagerConfiguration string
	ConfigurationVersion      string
	CreatedAt                 int64 `xorm:"created"`
}

type upgradeNgAlerting struct {
	migrator.MigrationBase
}

var _ migrator.CodeMigration = &upgradeNgAlerting{}

func (u *upgradeNgAlerting) Exec(sess *xorm.Session, migrator *migrator.Migrator) error {
	firstOrgId, err := u.updateAlertConfigurations(sess, migrator)
	if err != nil {
		return err
	}
	u.updateAlertmanagerFiles(firstOrgId, migrator)
	return nil
}

func (u *upgradeNgAlerting) updateAlertConfigurations(sess *xorm.Session, migrator *migrator.Migrator) (int64, error) {
	// if there are records with org_id == 0 then the feature flag was enabled before 8.2 that introduced org separation.
	// if feature is enabled in 8.2 the migration "AddDashAlertMigration", which is effectively different from what was run in 8.1.x and earlier versions,
	// will handle organizations correctly, and, therefore, nothing needs to be fixed
	count, err := sess.Table(&AlertConfiguration{}).Where("org_id = 0").Count()
	if err != nil {
		return 0, fmt.Errorf("failed to query table alert_configuration: %w", err)
	}
	if count == 0 {
		return 0, nil // NOTHING TO DO
	}

	orgs := make([]int64, 0)
	// get all org IDs sorted in ascending order
	if err = sess.Table("org").OrderBy("id").Cols("id").Find(&orgs); err != nil {
		return 0, fmt.Errorf("failed to query table org: %w", err)
	}
	if len(orgs) == 0 { // should not really happen
		migrator.Logger.Info("No organizations are found. Nothing to migrate")
		return 0, nil
	}

	firstOrg := orgs[0]

	// assigning all configurations to the first org because 0 does not usually point to any
	migrator.Logger.Info("Assigning all existing records from alert_configuration to the first organization", "org", firstOrg)
	_, err = sess.Cols("org_id").Where("org_id = 0").Update(&AlertConfiguration{OrgID: firstOrg})
	if err != nil {
		return 0, fmt.Errorf("failed to update org_id for all rows in the table alert_configuration: %w", err)
	}

	// if there is a single organization it is safe to assume that all configurations belong to it.
	if len(orgs) == 1 {
		return firstOrg, nil
	}
	// if there are many organizations we cannot safely assume what organization an alert_configuration belongs to.
	// Therefore, we apply the default configuration to all organizations. The previous version could be restored if needed.
	migrator.Logger.Warn("Detected many organizations. The current alertmanager configuration will be replaced by the default one")
	configs := make([]*AlertConfiguration, 0, len(orgs))
	for _, org := range orgs {
		configs = append(configs, &AlertConfiguration{
			AlertmanagerConfiguration: migrator.Cfg.UnifiedAlerting.DefaultConfiguration,
			// Since we are migration for a snapshot of the code, it is always going to migrate to
			// the v1 config.
			ConfigurationVersion: "v1",
			OrgID:                org,
		})
	}

	_, err = sess.InsertMulti(configs)
	if err != nil {
		return 0, fmt.Errorf("failed to add default alertmanager configurations to every organization: %w", err)
	}
	return 0, nil
}

// updateAlertmanagerFiles scans the existing alerting directory '<data_dir>/alerting' for known files.
// If argument 'orgId' is not 0 updateAlertmanagerFiles moves all known files to the directory <data_dir>/alerting/<orgId>.
// Otherwise, it deletes those files.
// pre-8.2 version put all configuration files into the root of alerting directory. Since 8.2 configuration files are put in organization specific directory
func (u *upgradeNgAlerting) updateAlertmanagerFiles(orgId int64, migrator *migrator.Migrator) {
	knownFiles := map[string]any{"__default__.tmpl": nil, "silences": nil, "notifications": nil}
	alertingDir := filepath.Join(migrator.Cfg.DataPath, "alerting")

	// do not fail if something goes wrong because these files are not used anymore. the worst that can happen is that we leave some leftovers behind
	deleteFile := func(fileName string) {
		path := filepath.Join(alertingDir, fileName)
		migrator.Logger.Info("Deleting alerting configuration file", "file", fileName)
		err := os.Remove(path)
		if err != nil {
			migrator.Logger.Warn("Failed to delete file", "file", path, "error", err)
		}
	}

	moveFile := func(fileName string) {
		alertingOrgDir := filepath.Join(alertingDir, strconv.FormatInt(orgId, 10))
		if err := os.MkdirAll(alertingOrgDir, 0750); err != nil {
			migrator.Logger.Error("Failed to create alerting directory for organization. Skip moving the file and delete it instead", "target_dir", alertingOrgDir, "org_id", orgId, "error", err, "file", fileName)
			deleteFile(fileName)
			return
		}
		err := os.Rename(filepath.Join(alertingDir, fileName), filepath.Join(alertingOrgDir, fileName))
		if err != nil {
			migrator.Logger.Error("Failed to move alertmanager configuration file to organization.", "source_dir", alertingDir, "target_dir", alertingOrgDir, "org_id", orgId, "error", err, "file", fileName)
			deleteFile(fileName)
		}
	}

	entries, err := os.ReadDir(alertingDir)
	if err != nil {
		if !os.IsNotExist(err) {
			keys := make([]string, 0, len(knownFiles))
			for key := range knownFiles {
				keys = append(keys, key)
			}
			migrator.Logger.Warn("Failed to clean up alerting directory. There may be files that are not used anymore.", "path", alertingDir, "files_to_delete", keys, "error", err)
		}
	}

	for _, entry := range entries {
		_, known := knownFiles[entry.Name()]
		if known {
			if orgId == 0 {
				deleteFile(entry.Name())
			} else {
				moveFile(entry.Name())
			}
		}
	}
}

func (u *upgradeNgAlerting) SQL(migrator.Dialect) string {
	return codeMigration
}

// CreateDefaultFoldersForAlertingMigration creates a folder dedicated for alerting if no folders exist
func CreateDefaultFoldersForAlertingMigration(mg *migrator.Migrator) {
	if !mg.Cfg.UnifiedAlerting.IsEnabled() {
		return
	}
	mg.AddMigration("create default alerting folders", &createDefaultFoldersForAlertingMigration{})
}

type createDefaultFoldersForAlertingMigration struct {
	migrator.MigrationBase
}

func (c createDefaultFoldersForAlertingMigration) Exec(sess *xorm.Session, migrator *migrator.Migrator) error {
	helper := folderHelper{
		sess: sess,
		mg:   migrator,
	}

	var rows []struct {
		Id   int64
		Name string
	}

	if err := sess.Table("org").Cols("id", "name").Find(&rows); err != nil {
		return fmt.Errorf("failed to read the list of organizations: %w", err)
	}

	orgsWithFolders, err := helper.getOrgsIDThatHaveFolders()
	if err != nil {
		return fmt.Errorf("failed to list organizations that have at least one folder: %w", err)
	}

	for _, row := range rows {
		// if there's at least one folder in the org or if alerting is disabled for that org, skip adding the default folder
		if _, ok := orgsWithFolders[row.Id]; ok {
			migrator.Logger.Debug("Skip adding default alerting folder because organization already has at least one folder", "org_id", row.Id)
			continue
		}
		if _, ok := migrator.Cfg.UnifiedAlerting.DisabledOrgs[row.Id]; ok {
			migrator.Logger.Debug("Skip adding default alerting folder because alerting is disabled for the organization ", "org_id", row.Id)
			continue
		}
		folder, err := helper.createGeneralFolder(row.Id)
		if err != nil {
			return fmt.Errorf("failed to create the default alerting folder for organization %s (ID: %d): %w", row.Name, row.Id, err)
		}
		migrator.Logger.Info("Created the default folder for alerting", "org_id", row.Id, "folder_name", folder.Title, "folder_uid", folder.Uid)
	}
	return nil
}

func (c createDefaultFoldersForAlertingMigration) SQL(migrator.Dialect) string {
	return codeMigration
}
