package setting

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	alertingCluster "github.com/grafana/alerting/cluster"
	"github.com/grafana/grafana-plugin-sdk-go/backend/gtime"
	"gopkg.in/ini.v1"

	"github.com/grafana/grafana/pkg/util"
)

const (
	alertmanagerDefaultClusterAddr        = "0.0.0.0:9094"
	alertmanagerDefaultPeerTimeout        = 15 * time.Second
	alertmanagerDefaultGossipInterval     = alertingCluster.DefaultGossipInterval
	alertmanagerDefaultPushPullInterval   = alertingCluster.DefaultPushPullInterval
	alertmanagerDefaultConfigPollInterval = time.Minute
	alertmanagerRedisDefaultMaxConns      = 5
	// To start, the alertmanager needs at least one route defined.
	// TODO: we should move this to Grafana settings and define this as the default.
	alertmanagerDefaultConfiguration = `{
	"alertmanager_config": {
		"route": {
			"receiver": "grafana-default-email",
			"group_by": ["grafana_folder", "alertname"]
		},
		"receivers": [{
			"name": "grafana-default-email",
			"grafana_managed_receiver_configs": [{
				"uid": "",
				"name": "email receiver",
				"type": "email",
				"isDefault": true,
				"settings": {
					"addresses": "<example@email.com>"
				}
			}]
		}]
	}
}
`
	evaluatorDefaultEvaluationTimeout       = 30 * time.Second
	schedulerDefaultAdminConfigPollInterval = time.Minute
	schedulerDefaultExecuteAlerts           = true
	schedulerDefaultMaxAttempts             = 1
	schedulerDefaultLegacyMinInterval       = 1
	screenshotsDefaultCapture               = false
	screenshotsDefaultCaptureTimeout        = 10 * time.Second
	screenshotsMaxCaptureTimeout            = 30 * time.Second
	screenshotsDefaultMaxConcurrent         = 5
	screenshotsDefaultUploadImageStorage    = false
	// SchedulerBaseInterval base interval of the scheduler. Controls how often the scheduler fetches database for new changes as well as schedules evaluation of a rule
	// changing this value is discouraged because this could cause existing alert definition
	// with intervals that are not exactly divided by this number not to be evaluated
	SchedulerBaseInterval = 10 * time.Second
	// DefaultRuleEvaluationInterval indicates a default interval of for how long a rule should be evaluated to change state from Pending to Alerting
	DefaultRuleEvaluationInterval = SchedulerBaseInterval * 6 // == 60 seconds
	stateHistoryDefaultEnabled    = true
)

type UnifiedAlertingSettings struct {
	AdminConfigPollInterval        time.Duration
	AlertmanagerConfigPollInterval time.Duration
	HAListenAddr                   string
	HAAdvertiseAddr                string
	HAPeers                        []string
	HAPeerTimeout                  time.Duration
	HAGossipInterval               time.Duration
	HAPushPullInterval             time.Duration
	HALabel                        string
	HARedisAddr                    string
	HARedisPeerName                string
	HARedisPrefix                  string
	HARedisUsername                string
	HARedisPassword                string
	HARedisDB                      int
	HARedisMaxConns                int
	MaxAttempts                    int64
	MinInterval                    time.Duration
	EvaluationTimeout              time.Duration
	DisableJitter                  bool
	ExecuteAlerts                  bool
	DefaultConfiguration           string
	Enabled                        *bool // determines whether unified alerting is enabled. If it is nil then user did not define it and therefore its value will be determined during migration. Services should not use it directly.
	DisabledOrgs                   map[int64]struct{}
	// BaseInterval interval of time the scheduler updates the rules and evaluates rules.
	// Only for internal use and not user configuration.
	BaseInterval time.Duration
	// DefaultRuleEvaluationInterval default interval between evaluations of a rule.
	DefaultRuleEvaluationInterval time.Duration
	Screenshots                   UnifiedAlertingScreenshotSettings
	ReservedLabels                UnifiedAlertingReservedLabelSettings
	StateHistory                  UnifiedAlertingStateHistorySettings
	RemoteAlertmanager            RemoteAlertmanagerSettings
	Upgrade                       UnifiedAlertingUpgradeSettings
	// MaxStateSaveConcurrency controls the number of goroutines (per rule) that can save alert state in parallel.
	MaxStateSaveConcurrency   int
	StatePeriodicSaveInterval time.Duration
	RulesPerRuleGroupLimit    int64
}

// RemoteAlertmanagerSettings contains the configuration needed
// to disable the internal Alertmanager and use an external one instead.
type RemoteAlertmanagerSettings struct {
	Enable       bool
	URL          string
	TenantID     string
	Password     string
	SyncInterval time.Duration
}

type UnifiedAlertingScreenshotSettings struct {
	Capture                    bool
	CaptureTimeout             time.Duration
	MaxConcurrentScreenshots   int64
	UploadExternalImageStorage bool
}

type UnifiedAlertingReservedLabelSettings struct {
	DisabledLabels map[string]struct{}
}

type UnifiedAlertingStateHistorySettings struct {
	Enabled       bool
	Backend       string
	LokiRemoteURL string
	LokiReadURL   string
	LokiWriteURL  string
	LokiTenantID  string
	// LokiBasicAuthUsername and LokiBasicAuthPassword are used for basic auth
	// if one of them is set.
	LokiBasicAuthPassword string
	LokiBasicAuthUsername string
	MultiPrimary          string
	MultiSecondaries      []string
	ExternalLabels        map[string]string
}

type UnifiedAlertingUpgradeSettings struct {
	// CleanUpgrade controls whether the upgrade process should clean up UA data when upgrading from legacy alerting.
	CleanUpgrade bool
}

// IsEnabled returns true if UnifiedAlertingSettings.Enabled is either nil or true.
// It hides the implementation details of the Enabled and simplifies its usage.
func (u *UnifiedAlertingSettings) IsEnabled() bool {
	return u.Enabled == nil || *u.Enabled
}

// IsReservedLabelDisabled returns true if UnifiedAlertingReservedLabelSettings.DisabledLabels contains the given reserved label.
func (u *UnifiedAlertingReservedLabelSettings) IsReservedLabelDisabled(label string) bool {
	_, ok := u.DisabledLabels[label]
	return ok
}

// readUnifiedAlertingEnabledSettings reads the settings for unified alerting.
// It returns a non-nil bool and a nil error when unified alerting is enabled either
// because it has been enabled in the settings or by default. It returns nil and
// a non-nil error both unified alerting and legacy alerting are enabled at the same time.
func (cfg *Cfg) readUnifiedAlertingEnabledSetting(section *ini.Section) (*bool, error) {
	// At present an invalid value is considered the same as no value. This means that a
	// spelling mistake in the string "false" could enable unified alerting rather
	// than disable it. This issue can be found here
	hasEnabled := section.Key("enabled").Value() != ""
	if !hasEnabled {
		// TODO: Remove in Grafana v10
		if cfg.IsFeatureToggleEnabled("ngalert") {
			cfg.Logger.Warn("ngalert feature flag is deprecated: use unified alerting enabled setting instead")
			// feature flag overrides the legacy alerting setting
			legacyAlerting := false
			cfg.AlertingEnabled = &legacyAlerting
			unifiedAlerting := true
			return &unifiedAlerting, nil
		}

		// if legacy alerting has not been configured then enable unified alerting
		if cfg.AlertingEnabled == nil {
			unifiedAlerting := true
			return &unifiedAlerting, nil
		}

		// enable unified alerting and disable legacy alerting
		legacyAlerting := false
		cfg.AlertingEnabled = &legacyAlerting
		unifiedAlerting := true
		return &unifiedAlerting, nil
	}

	unifiedAlerting, err := section.Key("enabled").Bool()
	if err != nil {
		// the value for unified alerting is invalid so disable all alerting
		legacyAlerting := false
		cfg.AlertingEnabled = &legacyAlerting
		return nil, fmt.Errorf("invalid value %s, should be either true or false", section.Key("enabled"))
	}

	// If both legacy and unified alerting are enabled then return an error
	if cfg.AlertingEnabled != nil && *(cfg.AlertingEnabled) && unifiedAlerting {
		return nil, errors.New("legacy and unified alerting cannot both be enabled at the same time, please disable one of them and restart Grafana")
	}

	if cfg.AlertingEnabled == nil {
		legacyAlerting := !unifiedAlerting
		cfg.AlertingEnabled = &legacyAlerting
	}

	return &unifiedAlerting, nil
}

// ReadUnifiedAlertingSettings reads both the `unified_alerting` and `alerting` sections of the configuration while preferring configuration the `alerting` section.
// It first reads the `unified_alerting` section, then looks for non-defaults on the `alerting` section and prefers those.
func (cfg *Cfg) ReadUnifiedAlertingSettings(iniFile *ini.File) error {
	var err error
	uaCfg := UnifiedAlertingSettings{}
	ua := iniFile.Section("unified_alerting")
	uaCfg.Enabled, err = cfg.readUnifiedAlertingEnabledSetting(ua)
	if err != nil {
		return fmt.Errorf("failed to read unified alerting enabled setting: %w", err)
	}

	uaCfg.DisabledOrgs = make(map[int64]struct{})
	orgsStr := valueAsString(ua, "disabled_orgs", "")
	for _, org := range util.SplitString(orgsStr) {
		orgID, err := strconv.ParseInt(org, 10, 64)
		if err != nil {
			return err
		}
		uaCfg.DisabledOrgs[orgID] = struct{}{}
	}

	uaCfg.AdminConfigPollInterval, err = gtime.ParseDuration(valueAsString(ua, "admin_config_poll_interval", (schedulerDefaultAdminConfigPollInterval).String()))
	if err != nil {
		return err
	}
	uaCfg.AlertmanagerConfigPollInterval, err = gtime.ParseDuration(valueAsString(ua, "alertmanager_config_poll_interval", (alertmanagerDefaultConfigPollInterval).String()))
	if err != nil {
		return err
	}
	uaCfg.HAPeerTimeout, err = gtime.ParseDuration(valueAsString(ua, "ha_peer_timeout", (alertmanagerDefaultPeerTimeout).String()))
	if err != nil {
		return err
	}
	uaCfg.HAGossipInterval, err = gtime.ParseDuration(valueAsString(ua, "ha_gossip_interval", (alertmanagerDefaultGossipInterval).String()))
	if err != nil {
		return err
	}
	uaCfg.HAPushPullInterval, err = gtime.ParseDuration(valueAsString(ua, "ha_push_pull_interval", (alertmanagerDefaultPushPullInterval).String()))
	if err != nil {
		return err
	}
	uaCfg.HAListenAddr = ua.Key("ha_listen_address").MustString(alertmanagerDefaultClusterAddr)
	uaCfg.HAAdvertiseAddr = ua.Key("ha_advertise_address").MustString("")
	uaCfg.HALabel = ua.Key("ha_label").MustString("")
	uaCfg.HARedisAddr = ua.Key("ha_redis_address").MustString("")
	uaCfg.HARedisPeerName = ua.Key("ha_redis_peer_name").MustString("")
	uaCfg.HARedisPrefix = ua.Key("ha_redis_prefix").MustString("")
	uaCfg.HARedisUsername = ua.Key("ha_redis_username").MustString("")
	uaCfg.HARedisPassword = ua.Key("ha_redis_password").MustString("")
	uaCfg.HARedisDB = ua.Key("ha_redis_db").MustInt(0)
	uaCfg.HARedisMaxConns = ua.Key("ha_redis_max_conns").MustInt(alertmanagerRedisDefaultMaxConns)
	peers := ua.Key("ha_peers").MustString("")
	uaCfg.HAPeers = make([]string, 0)
	if peers != "" {
		for _, peer := range strings.Split(peers, ",") {
			peer = strings.TrimSpace(peer)
			uaCfg.HAPeers = append(uaCfg.HAPeers, peer)
		}
	}

	// TODO load from ini file
	uaCfg.DefaultConfiguration = alertmanagerDefaultConfiguration
	uaCfg.ExecuteAlerts = ua.Key("execute_alerts").MustBool(schedulerDefaultExecuteAlerts)

	// if the unified alerting options equal the defaults, apply the respective legacy one
	uaEvaluationTimeout, err := gtime.ParseDuration(valueAsString(ua, "evaluation_timeout", evaluatorDefaultEvaluationTimeout.String()))
	if err != nil {
		return fmt.Errorf("failed to parse setting `evaluation_timeout` as duration: %w", err)
	}
	uaCfg.EvaluationTimeout = uaEvaluationTimeout

	uaCfg.MaxAttempts = ua.Key("max_attempts").MustInt64(schedulerDefaultMaxAttempts)

	uaCfg.BaseInterval = SchedulerBaseInterval

	// TODO: This was promoted from a feature toggle and is now the default behavior.
	// We can consider removing the knob entirely in a release after 10.4.
	uaCfg.DisableJitter = ua.Key("disable_jitter").MustBool(false)

	// The base interval of the scheduler for evaluating alerts.
	// 1. It is used by the internal scheduler's timer to tick at this interval.
	// 2. to spread evaluations of rules that need to be evaluated at the current tick T. In other words, the evaluation of rules at the tick T will be evenly spread in the interval from T to T+scheduler_tick_interval.
	//    For example, if there are 100 rules that need to be evaluated at tick T, and the base interval is 10s, rules will be evaluated every 100ms.
	// 3. It increases delay between rule updates and state reset.
	// NOTE:
	// 1. All alert rule intervals should be times of this interval. Otherwise, the rules will not be evaluated. It is not recommended to set it lower than 10s or odd numbers. Recommended: 10s, 30s, 1m
	// 2. The increasing of the interval will affect how slow alert rule updates will reset the state, and therefore reset notification. Higher the interval - slower propagation of the changes.
	baseInterval, err := gtime.ParseDuration(valueAsString(ua, "scheduler_tick_interval", SchedulerBaseInterval.String()))
	if cfg.IsFeatureToggleEnabled("configurableSchedulerTick") { // use literal to avoid cycle imports
		if err != nil {
			return fmt.Errorf("failed to parse setting 'scheduler_tick_interval' as duration: %w", err)
		}
		if baseInterval != SchedulerBaseInterval {
			cfg.Logger.Warn("Scheduler tick interval is changed to non-default", "interval", baseInterval, "default", SchedulerBaseInterval)
		}
		uaCfg.BaseInterval = baseInterval
	} else if baseInterval != SchedulerBaseInterval {
		cfg.Logger.Warn("Scheduler tick interval is changed to non-default but the feature flag is not enabled. Using default.", "interval", baseInterval, "default", SchedulerBaseInterval)
	}

	uaMinInterval, err := gtime.ParseDuration(valueAsString(ua, "min_interval", uaCfg.BaseInterval.String()))
	if err != nil {
		return fmt.Errorf("failed to parse setting `min_interval` as duration: %w", err)
	}

	if uaMinInterval < uaCfg.BaseInterval {
		return fmt.Errorf("value of setting 'min_interval' should be greater than the base interval (%v)", uaCfg.BaseInterval)
	}
	if uaMinInterval%uaCfg.BaseInterval != 0 {
		return fmt.Errorf("value of setting 'min_interval' should be times of base interval (%v)", uaCfg.BaseInterval)
	}
	uaCfg.MinInterval = uaMinInterval

	uaCfg.DefaultRuleEvaluationInterval = DefaultRuleEvaluationInterval
	if uaMinInterval > uaCfg.DefaultRuleEvaluationInterval {
		uaCfg.DefaultRuleEvaluationInterval = uaMinInterval
	}

	quotas := iniFile.Section("quota")
	uaCfg.RulesPerRuleGroupLimit = quotas.Key("alerting_rule_group_rules").MustInt64(100)

	remoteAlertmanager := iniFile.Section("remote.alertmanager")
	uaCfgRemoteAM := RemoteAlertmanagerSettings{
		Enable:   remoteAlertmanager.Key("enabled").MustBool(false),
		URL:      remoteAlertmanager.Key("url").MustString(""),
		TenantID: remoteAlertmanager.Key("tenant").MustString(""),
		Password: remoteAlertmanager.Key("password").MustString(""),
	}
	uaCfgRemoteAM.SyncInterval, err = gtime.ParseDuration(valueAsString(remoteAlertmanager, "sync_interval", (schedulerDefaultAdminConfigPollInterval).String()))
	if err != nil {
		return err
	}

	uaCfg.RemoteAlertmanager = uaCfgRemoteAM

	screenshots := iniFile.Section("unified_alerting.screenshots")
	uaCfgScreenshots := uaCfg.Screenshots

	uaCfgScreenshots.Capture = screenshots.Key("capture").MustBool(screenshotsDefaultCapture)

	captureTimeout := screenshots.Key("capture_timeout").MustDuration(screenshotsDefaultCaptureTimeout)
	if captureTimeout > screenshotsMaxCaptureTimeout {
		return fmt.Errorf("value of setting 'capture_timeout' cannot exceed %s", screenshotsMaxCaptureTimeout)
	}
	uaCfgScreenshots.CaptureTimeout = captureTimeout

	uaCfgScreenshots.MaxConcurrentScreenshots = screenshots.Key("max_concurrent_screenshots").MustInt64(screenshotsDefaultMaxConcurrent)
	uaCfgScreenshots.UploadExternalImageStorage = screenshots.Key("upload_external_image_storage").MustBool(screenshotsDefaultUploadImageStorage)
	uaCfg.Screenshots = uaCfgScreenshots

	reservedLabels := iniFile.Section("unified_alerting.reserved_labels")
	uaCfgReservedLabels := UnifiedAlertingReservedLabelSettings{
		DisabledLabels: make(map[string]struct{}),
	}
	for _, label := range util.SplitString(reservedLabels.Key("disabled_labels").MustString("")) {
		uaCfgReservedLabels.DisabledLabels[label] = struct{}{}
	}
	uaCfg.ReservedLabels = uaCfgReservedLabels

	stateHistory := iniFile.Section("unified_alerting.state_history")
	stateHistoryLabels := iniFile.Section("unified_alerting.state_history.external_labels")
	uaCfgStateHistory := UnifiedAlertingStateHistorySettings{
		Enabled:               stateHistory.Key("enabled").MustBool(stateHistoryDefaultEnabled),
		Backend:               stateHistory.Key("backend").MustString("annotations"),
		LokiRemoteURL:         stateHistory.Key("loki_remote_url").MustString(""),
		LokiReadURL:           stateHistory.Key("loki_remote_read_url").MustString(""),
		LokiWriteURL:          stateHistory.Key("loki_remote_write_url").MustString(""),
		LokiTenantID:          stateHistory.Key("loki_tenant_id").MustString(""),
		LokiBasicAuthUsername: stateHistory.Key("loki_basic_auth_username").MustString(""),
		LokiBasicAuthPassword: stateHistory.Key("loki_basic_auth_password").MustString(""),
		MultiPrimary:          stateHistory.Key("primary").MustString(""),
		MultiSecondaries:      splitTrim(stateHistory.Key("secondaries").MustString(""), ","),
		ExternalLabels:        stateHistoryLabels.KeysHash(),
	}
	uaCfg.StateHistory = uaCfgStateHistory

	uaCfg.MaxStateSaveConcurrency = ua.Key("max_state_save_concurrency").MustInt(1)

	uaCfg.StatePeriodicSaveInterval, err = gtime.ParseDuration(valueAsString(ua, "state_periodic_save_interval", (time.Minute * 5).String()))
	if err != nil {
		return err
	}

	upgrade := iniFile.Section("unified_alerting.upgrade")
	uaCfgUpgrade := UnifiedAlertingUpgradeSettings{
		CleanUpgrade: upgrade.Key("clean_upgrade").MustBool(false),
	}
	uaCfg.Upgrade = uaCfgUpgrade

	cfg.UnifiedAlerting = uaCfg
	return nil
}

func GetAlertmanagerDefaultConfiguration() string {
	return alertmanagerDefaultConfiguration
}

func splitTrim(s string, sep string) []string {
	spl := strings.Split(s, sep)
	for i := range spl {
		spl[i] = strings.TrimSpace(spl[i])
	}
	return spl
}
