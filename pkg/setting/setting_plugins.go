package setting

import (
	"strings"

	"gopkg.in/ini.v1"
)

// PluginSettings maps plugin id to map of key/value settings.
type PluginSettings map[string]map[string]string

func extractPluginSettings(sections []*ini.Section) PluginSettings {
	psMap := PluginSettings{}
	for _, section := range sections {
		sectionName := section.Name()
		if !strings.HasPrefix(sectionName, "plugin.") {
			continue
		}

		pluginID := strings.Replace(sectionName, "plugin.", "", 1)
		psMap[pluginID] = section.KeysHash()
	}

	return psMap
}

func (cfg *Cfg) readPluginSettings(iniFile *ini.File) error {
	pluginsSection := iniFile.Section("plugins")

	cfg.PluginsEnableAlpha = pluginsSection.Key("enable_alpha").MustBool(false)
	cfg.PluginsAppsSkipVerifyTLS = pluginsSection.Key("app_tls_skip_verify_insecure").MustBool(false)
	cfg.PluginSettings = extractPluginSettings(iniFile.Sections())
	cfg.PluginSkipPublicKeyDownload = pluginsSection.Key("public_key_retrieval_disabled").MustBool(false)
	cfg.PluginForcePublicKeyDownload = pluginsSection.Key("public_key_retrieval_on_startup").MustBool(false)

	cfg.PluginsAllowUnsigned = readPluginIDsList(pluginsSection.Key("allow_loading_unsigned_plugins").MustString(""))
	cfg.DisablePlugins = readPluginIDsList(pluginsSection.Key("disable_plugins").MustString(""))
	cfg.HideAngularDeprecation = readPluginIDsList(pluginsSection.Key("hide_angular_deprecation").MustString(""))
	cfg.ForwardHostEnvVars = readPluginIDsList(pluginsSection.Key("forward_host_env_vars").MustString(""))

	cfg.PluginCatalogURL = pluginsSection.Key("plugin_catalog_url").MustString("https://grafana.com/grafana/plugins/")
	cfg.PluginAdminEnabled = pluginsSection.Key("plugin_admin_enabled").MustBool(true)
	cfg.PluginAdminExternalManageEnabled = pluginsSection.Key("plugin_admin_external_manage_enabled").MustBool(false)
	cfg.PluginCatalogHiddenPlugins = readPluginIDsList(pluginsSection.Key("plugin_catalog_hidden_plugins").MustString(""))

	// Pull disabled plugins from the catalog
	cfg.PluginCatalogHiddenPlugins = append(cfg.PluginCatalogHiddenPlugins, cfg.DisablePlugins...)

	// Plugins CDN settings
	cfg.PluginsCDNURLTemplate = strings.TrimRight(pluginsSection.Key("cdn_base_url").MustString(""), "/")
	cfg.PluginLogBackendRequests = pluginsSection.Key("log_backend_requests").MustBool(false)

	// Installation token for managed plugins
	cfg.PluginInstallToken = pluginsSection.Key("install_token").MustString("")

	return nil
}

// readPluginIDsList takes a config value containing a list of plugin ids separated by commas and returns the
// corresponding slice of strings. Each value has its leading and trailing whitespace removed. Empty values are
// discarded.
func readPluginIDsList(configValue string) []string {
	var r []string
	for _, id := range strings.Split(configValue, ",") {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		r = append(r, id)
	}
	return r
}
