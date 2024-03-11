package strategies

import (
	"context"
	"maps"

	"github.com/grafana/grafana/pkg/services/samlsettings"
	"github.com/grafana/grafana/pkg/setting"
)

type SAMLStrategy struct {
	cfg              *setting.Cfg
	settingsProvider setting.Provider
	settings         map[string]any
}

var _ samlsettings.FallbackStrategy = (*SAMLStrategy)(nil)

func NewSAMLStrategy(cfg *setting.Cfg, settingsProvider setting.Provider) *SAMLStrategy {
	samlStrategy := &SAMLStrategy{
		cfg:              cfg,
		settingsProvider: settingsProvider,
		settings:         make(map[string]any),
	}

	section := samlStrategy.settingsProvider.Section("auth.saml")
	samlStrategy.settings = samlStrategy.loadSAMLSettings(section)

	return samlStrategy
}

func (s *SAMLStrategy) GetProviderConfig(_ context.Context, provider string) (map[string]any, error) {
	result := make(map[string]any, len(s.settings))
	maps.Copy(result, s.settings)
	return result, nil
}

func (s *SAMLStrategy) loadSAMLSettings(section setting.Section) map[string]any {
	result := map[string]any{
		"enabled":                    section.KeyValue("enabled").MustBool(false),
		"single_logout":              section.KeyValue("single_logout").MustBool(false),
		"allow_sign_up":              section.KeyValue("allow_sign_up").MustBool(false),
		"auto_login":                 section.KeyValue("auto_login").MustBool(false),
		"certificate":                section.KeyValue("certificate").MustString(""),
		"certificate_path":           section.KeyValue("certificate_path").MustString(""),
		"private_key":                section.KeyValue("private_key").MustString(""),
		"private_key_path":           section.KeyValue("private_key_path").MustString(""),
		"signature_algorithm":        section.KeyValue("signature_algorithm").MustString(""),
		"idp_metadata":               section.KeyValue("idp_metadata").MustString(""),
		"idp_metadata_path":          section.KeyValue("idp_metadata_path").MustString(""),
		"idp_metadata_url":           section.KeyValue("idp_metadata_url").MustString(""),
		"max_issue_delay":            section.KeyValue("max_issue_delay").MustString(""),
		"metadata_valid_duration":    section.KeyValue("metadata_valid_duration").MustString(""),
		"allow_idp_initiated":        section.KeyValue("allow_idp_initiated").MustBool(false),
		"relay_state":                section.KeyValue("relay_state").MustString(""),
		"assertion_attribute_name":   section.KeyValue("assertion_attribute_name").MustString(""),
		"assertion_attribute_login":  section.KeyValue("assertion_attribute_login").MustString(""),
		"assertion_attribute_email":  section.KeyValue("assertion_attribute_email").MustString(""),
		"assertion_attribute_groups": section.KeyValue("assertion_attribute_groups").MustString(""),
		"assertion_attribute_role":   section.KeyValue("assertion_attribute_role").MustString(""),
		"assertion_attribute_org":    section.KeyValue("assertion_attribute_org").MustString(""),
		"allowed_organizations":      section.KeyValue("allowed_organizations").MustString(""),
		"org_mapping":                section.KeyValue("org_mapping").MustString(""),
		"role_values_editor":         section.KeyValue("role_values_editor").MustString(""),
		"role_values_admin":          section.KeyValue("role_values_admin").MustString(""),
		"role_values_grafana_admin":  section.KeyValue("role_values_grafana_admin").MustString(""),
		"name_id_format":             section.KeyValue("name_id_format").MustString(""),
		"skip_org_role_sync":         section.KeyValue("skip_org_role_sync").MustBool(false),
		"role_values_none":           section.KeyValue("role_values_none").MustString(""),
	}
	return result
}
