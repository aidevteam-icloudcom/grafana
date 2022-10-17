package ualert

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"github.com/prometheus/alertmanager/pkg/labels"
	"github.com/prometheus/common/model"

	"github.com/grafana/grafana/pkg/components/simplejson"
	ngModels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/util"
)

type notificationChannel struct {
	ID                    int64            `xorm:"id"`
	OrgID                 int64            `xorm:"org_id"`
	Uid                   string           `xorm:"uid"`
	Name                  string           `xorm:"name"`
	Type                  string           `xorm:"type"`
	DisableResolveMessage bool             `xorm:"disable_resolve_message"`
	IsDefault             bool             `xorm:"is_default"`
	Settings              *simplejson.Json `xorm:"settings"`
	SecureSettings        SecureJsonData   `xorm:"secure_settings"`
}

// channelsPerOrg maps notification channels per organisation
type channelsPerOrg map[int64][]*notificationChannel

// channelMap maps notification channels per organisation
type defaultChannelsPerOrg map[int64][]*notificationChannel

// uidOrID for both uid and ID, primarily used for mapping legacy channel to migrated receiver.
type uidOrID interface{}

// setupAlertmanagerConfigs creates Alertmanager configs with migrated receivers and routes.
func (m *migration) setupAlertmanagerConfigs(rulesPerOrg map[int64]map[*alertRule][]uidOrID) (amConfigsPerOrg, error) {
	// allChannels: channelUID -> channelConfig
	allChannelsPerOrg, defaultChannelsPerOrg, err := m.getNotificationChannelMap()
	if err != nil {
		return nil, fmt.Errorf("failed to load notification channels: %w", err)
	}

	amConfigPerOrg := make(amConfigsPerOrg, len(allChannelsPerOrg))
	for orgID, channels := range allChannelsPerOrg {
		amConfig := &PostableUserConfig{
			AlertmanagerConfig: PostableApiAlertingConfig{
				Receivers: make([]*PostableApiReceiver, 0),
			},
		}
		amConfigPerOrg[orgID] = amConfig

		// Create all newly migrated receivers from legacy notification channels.
		receiversMap, receivers, err := m.createReceivers(channels)
		if err != nil {
			return nil, fmt.Errorf("failed to create receiver in orgId %d: %w", orgID, err)
		}

		// No need to create an Alertmanager configuration if there are no receivers left that aren't obsolete.
		if len(receivers) == 0 {
			m.mg.Logger.Warn("no available receivers", "orgId", orgID)
			continue
		}

		amConfig.AlertmanagerConfig.Receivers = receivers

		defaultReceivers := make(map[string]struct{})
		defaultChannels, ok := defaultChannelsPerOrg[orgID]
		if ok {
			// If the organization has default channels build a map of default receivers, used to create alert-specific routes later.
			for _, c := range defaultChannels {
				defaultReceivers[c.Name] = struct{}{}
			}
		}
		defaultReceiver, defaultRoute, err := m.createDefaultRouteAndReceiver(defaultChannels)
		if err != nil {
			return nil, fmt.Errorf("failed to create default route & receiver in orgId %d: %w", orgID, err)
		}
		amConfig.AlertmanagerConfig.Route = defaultRoute
		if defaultReceiver != nil {
			amConfig.AlertmanagerConfig.Receivers = append(amConfig.AlertmanagerConfig.Receivers, defaultReceiver)
		}

		for _, recv := range receivers {
			route, err := createRoute(recv)
			if err != nil {
				return nil, fmt.Errorf("failed to create route for receiver %s in orgId %d: %w", recv.Name, orgID, err)
			}

			amConfigPerOrg[orgID].AlertmanagerConfig.Route.Routes = append(amConfigPerOrg[orgID].AlertmanagerConfig.Route.Routes, route)
		}

		for ar, channelUids := range rulesPerOrg[orgID] {
			filteredReceiverNames := m.filterReceiversForAlert(ar.Title, channelUids, receiversMap, defaultReceivers)

			if len(filteredReceiverNames) != 0 {
				// Only create a contact label if there are specific receivers, otherwise it defaults to the root-level route.
				ar.Labels[ContactLabel], err = keysString(filteredReceiverNames)
				if err != nil {
					return nil, fmt.Errorf("failed to create contact label for alertRule %s in orgId %d: %w", ar.Title, orgID, err)
				}
			}
		}

		// Validate the alertmanager configuration produced, this gives a chance to catch bad configuration at migration time.
		// Validation between legacy and unified alerting can be different (e.g. due to bug fixes) so this would fail the migration in that case.
		if err := m.validateAlertmanagerConfig(orgID, amConfig); err != nil {
			return nil, fmt.Errorf("failed to validate AlertmanagerConfig in orgId %d: %w", orgID, err)
		}
	}

	return amConfigPerOrg, nil
}

func keysString(m map[string]interface{}) (string, error) {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	jsonStr, err := json.Marshal(keys)
	if err != nil {
		return "", err
	}

	return string(jsonStr), nil
}

// getNotificationChannelMap returns a map of all channelUIDs to channel config as well as a separate map for just those channels that are default.
// For any given Organization, all channels in defaultChannelsPerOrg should also exist in channelsPerOrg.
func (m *migration) getNotificationChannelMap() (channelsPerOrg, defaultChannelsPerOrg, error) {
	q := `
	SELECT id,
		org_id,
		uid,
		name,
		type,
		disable_resolve_message,
		is_default,
		settings,
		secure_settings
	FROM
		alert_notification
	`
	allChannels := []notificationChannel{}
	err := m.sess.SQL(q).Find(&allChannels)
	if err != nil {
		return nil, nil, err
	}

	if len(allChannels) == 0 {
		return nil, nil, nil
	}

	allChannelsMap := make(channelsPerOrg)
	defaultChannelsMap := make(defaultChannelsPerOrg)
	for i, c := range allChannels {
		if c.Type == "hipchat" || c.Type == "sensu" {
			m.mg.Logger.Error("alert migration error: discontinued notification channel found", "type", c.Type, "name", c.Name, "uid", c.Uid)
			continue
		}

		allChannelsMap[c.OrgID] = append(allChannelsMap[c.OrgID], &allChannels[i])

		if c.IsDefault {
			defaultChannelsMap[c.OrgID] = append(defaultChannelsMap[c.OrgID], &allChannels[i])
		}
	}

	return allChannelsMap, defaultChannelsMap, nil
}

// Create a notifier (PostableGrafanaReceiver) from a legacy notification channel
func (m *migration) createNotifier(c *notificationChannel) (*PostableGrafanaReceiver, error) {
	uid, err := m.generateChannelUID()
	if err != nil {
		return nil, err
	}

	settings, secureSettings, err := migrateSettingsToSecureSettings(c.Type, c.Settings, c.SecureSettings)
	if err != nil {
		return nil, err
	}

	return &PostableGrafanaReceiver{
		UID:                   uid,
		Name:                  c.Name,
		Type:                  c.Type,
		DisableResolveMessage: c.DisableResolveMessage,
		Settings:              settings,
		SecureSettings:        secureSettings,
	}, nil
}

// Create one receiver for every unique notification channel.
func (m *migration) createReceivers(allChannels []*notificationChannel) (map[uidOrID]*PostableApiReceiver, []*PostableApiReceiver, error) {
	var receivers []*PostableApiReceiver
	receiversMap := make(map[uidOrID]*PostableApiReceiver)
	for _, c := range allChannels {
		notifier, err := m.createNotifier(c)
		if err != nil {
			return nil, nil, err
		}

		recv := &PostableApiReceiver{
			Name:                    c.Name, // Channel name is unique within an Org.
			GrafanaManagedReceivers: []*PostableGrafanaReceiver{notifier},
		}

		receivers = append(receivers, recv)

		// Store receivers for creating routes from alert rules later.
		if c.Uid != "" {
			receiversMap[c.Uid] = recv
		}
		if c.ID != 0 {
			// In certain circumstances, the alert rule uses ID instead of uid. So, we add this to be able to lookup by ID in case.
			receiversMap[c.ID] = recv
		}
	}

	return receiversMap, receivers, nil
}

// Create the root-level route with the default receiver. If no new receiver is created specifically for the root-level route, the returned receiver will be nil.
func (m *migration) createDefaultRouteAndReceiver(defaultChannels []*notificationChannel) (*PostableApiReceiver, *Route, error) {
	var defaultReceiver *PostableApiReceiver

	defaultReceiverName := "autogen-contact-point-default"
	if len(defaultChannels) != 1 {
		// If there are zero or more than one default channels we create a separate contact group that is used only in the root policy. This is to simplify the migrated notification policy structure.
		// If we ever allow more than one receiver per route this won't be necessary.
		defaultReceiver = &PostableApiReceiver{
			Name:                    defaultReceiverName,
			GrafanaManagedReceivers: []*PostableGrafanaReceiver{},
		}

		for _, c := range defaultChannels {
			// Need to create a new notifier to prevent uid conflict.
			defaultNotifier, err := m.createNotifier(c)
			if err != nil {
				return nil, nil, err
			}

			defaultReceiver.GrafanaManagedReceivers = append(defaultReceiver.GrafanaManagedReceivers, defaultNotifier)
		}
	} else {
		// If there is only a single default channel, we don't need a separate receiver to hold it. We can reuse the existing receiver for that single notifier.
		defaultReceiverName = defaultChannels[0].Name
	}

	defaultRoute := &Route{
		Receiver:   defaultReceiverName,
		Routes:     make([]*Route, 0),
		GroupByStr: []string{ngModels.FolderTitleLabel, model.AlertNameLabel}, // To keep parity with pre-migration notifications.
	}

	return defaultReceiver, defaultRoute, nil
}

// Create one route per contact point, matching based on ContactLabel.
func createRoute(recv *PostableApiReceiver) (*Route, error) {
	// We create a regex matcher so that each alert rule need only have a single ContactLabel entry for all contact points it needs to send to.
	// For example, if an alert needs to send to contact1 and contact2 it will have ContactLabel=`["contact1","contact2"]` and will match both routes looking
	// for `.*"contact1".*` and `.*"contact2".*`.
	mat, err := labels.NewMatcher(labels.MatchRegexp, ContactLabel, fmt.Sprintf(`.*"%s".*`, recv.Name))
	if err != nil {
		return nil, err
	}

	return &Route{
		Receiver: recv.Name,
		Matchers: Matchers{mat},
		Continue: true, // We continue so that each sibling contact point route can separately match.
	}, nil
}

// Filter receivers to select those that were associated to the given rule as channels.
func (m *migration) filterReceiversForAlert(name string, channelIDs []uidOrID, receivers map[uidOrID]*PostableApiReceiver, defaultReceivers map[string]struct{}) map[string]interface{} {
	if len(channelIDs) == 0 {
		// If there are no channels associated, we use the default route.
		return nil
	}

	// Filter receiver names.
	filteredReceiverNames := make(map[string]interface{})
	for _, uidOrId := range channelIDs {
		recv, ok := receivers[uidOrId]
		if ok {
			filteredReceiverNames[recv.Name] = struct{}{} // Deduplicate on contact point name.
		} else {
			m.mg.Logger.Warn("alert linked to obsolete notification channel, ignoring", "alert", name, "uid", uidOrId)
		}
	}

	coveredByDefault := func(names map[string]interface{}) bool {
		// Check if all receivers are also default ones and if so, just use the default route.
		for n := range names {
			if _, ok := defaultReceivers[n]; !ok {
				return false
			}
		}
		return true
	}

	if len(filteredReceiverNames) == 0 || coveredByDefault(filteredReceiverNames) {
		// Use the default route instead.
		return nil
	}

	// Add default receivers alongside rule-specific ones.
	for n := range defaultReceivers {
		filteredReceiverNames[n] = struct{}{}
	}

	return filteredReceiverNames
}

func (m *migration) generateChannelUID() (string, error) {
	for i := 0; i < 5; i++ {
		gen := util.GenerateShortUID()
		if _, ok := m.seenChannelUIDs[gen]; !ok {
			m.seenChannelUIDs[gen] = struct{}{}
			return gen, nil
		}
	}

	return "", errors.New("failed to generate UID for notification channel")
}

// Some settings were migrated from settings to secure settings in between.
// See https://grafana.com/docs/grafana/latest/installation/upgrading/#ensure-encryption-of-existing-alert-notification-channel-secrets.
// migrateSettingsToSecureSettings takes care of that.
func migrateSettingsToSecureSettings(chanType string, settings *simplejson.Json, secureSettings SecureJsonData) (*simplejson.Json, map[string]string, error) {
	keys := []string{}
	switch chanType {
	case "slack":
		keys = []string{"url", "token"}
	case "pagerduty":
		keys = []string{"integrationKey"}
	case "webhook":
		keys = []string{"password"}
	case "prometheus-alertmanager":
		keys = []string{"basicAuthPassword"}
	case "opsgenie":
		keys = []string{"apiKey"}
	case "telegram":
		keys = []string{"bottoken"}
	case "line":
		keys = []string{"token"}
	case "pushover":
		keys = []string{"apiToken", "userKey"}
	case "threema":
		keys = []string{"api_secret"}
	}

	newSecureSettings := secureSettings.Decrypt()
	cloneSettings := simplejson.New()
	settingsMap, err := settings.Map()
	if err != nil {
		return nil, nil, err
	}
	for k, v := range settingsMap {
		cloneSettings.Set(k, v)
	}
	for _, k := range keys {
		if v, ok := newSecureSettings[k]; ok && v != "" {
			continue
		}

		sv := cloneSettings.Get(k).MustString()
		if sv != "" {
			newSecureSettings[k] = sv
			cloneSettings.Del(k)
		}
	}

	encryptedData := GetEncryptedJsonData(newSecureSettings)
	for k, v := range encryptedData {
		newSecureSettings[k] = base64.StdEncoding.EncodeToString(v)
	}

	return cloneSettings, newSecureSettings, nil
}

// Below is a snapshot of all the config and supporting functions imported
// to avoid vendoring those packages.

type PostableUserConfig struct {
	TemplateFiles      map[string]string         `yaml:"template_files" json:"template_files"`
	AlertmanagerConfig PostableApiAlertingConfig `yaml:"alertmanager_config" json:"alertmanager_config"`
}

type amConfigsPerOrg = map[int64]*PostableUserConfig

type PostableApiAlertingConfig struct {
	Route     *Route                 `yaml:"route,omitempty" json:"route,omitempty"`
	Templates []string               `yaml:"templates" json:"templates"`
	Receivers []*PostableApiReceiver `yaml:"receivers,omitempty" json:"receivers,omitempty"`
}

type Route struct {
	Receiver   string   `yaml:"receiver,omitempty" json:"receiver,omitempty"`
	Matchers   Matchers `yaml:"matchers,omitempty" json:"matchers,omitempty"`
	Routes     []*Route `yaml:"routes,omitempty" json:"routes,omitempty"`
	Continue   bool     `yaml:"continue,omitempty" json:"continue,omitempty"`
	GroupByStr []string `yaml:"group_by,omitempty" json:"group_by,omitempty"`
}

type Matchers labels.Matchers

func (m Matchers) MarshalJSON() ([]byte, error) {
	if len(m) == 0 {
		return nil, nil
	}
	result := make([]string, len(m))
	for i, matcher := range m {
		result[i] = matcher.String()
	}
	return json.Marshal(result)
}

type PostableApiReceiver struct {
	Name                    string                     `yaml:"name" json:"name"`
	GrafanaManagedReceivers []*PostableGrafanaReceiver `yaml:"grafana_managed_receiver_configs,omitempty" json:"grafana_managed_receiver_configs,omitempty"`
}

type PostableGrafanaReceiver CreateAlertNotificationCommand

type CreateAlertNotificationCommand struct {
	UID                   string            `json:"uid"`
	Name                  string            `json:"name"`
	Type                  string            `json:"type"`
	DisableResolveMessage bool              `json:"disableResolveMessage"`
	Settings              *simplejson.Json  `json:"settings"`
	SecureSettings        map[string]string `json:"secureSettings"`
}
