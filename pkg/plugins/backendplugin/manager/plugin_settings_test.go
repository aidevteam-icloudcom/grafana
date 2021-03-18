package manager

import (
	"sort"
	"testing"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/require"
)

func TestPluginSettings(t *testing.T) {
	t.Run("Should only extract from sections beginning with 'plugin.' in config", func(t *testing.T) {
		cfg := &setting.Cfg{
			PluginSettings: setting.PluginSettings{
				"plugin": map[string]string{
					"key1": "value1",
					"key2": "value2",
				},
			},
		}

		pm := manager{Cfg: cfg}
		pm.extractPluginSettings()
		require.Len(t, pm.pluginSettings, 1)
		require.Len(t, pm.pluginSettings["plugin"], 2)

		t.Run("Should skip path setting", func(t *testing.T) {
			cfg.PluginSettings["plugin"]["path"] = "value"
			pm := manager{Cfg: cfg}
			pm.extractPluginSettings()
			require.Len(t, pm.pluginSettings["plugin"], 2)
		})

		t.Run("Should skip id setting", func(t *testing.T) {
			cfg.PluginSettings["plugin"]["id"] = "value"
			pm := manager{Cfg: cfg}
			pm.extractPluginSettings()
			require.Len(t, pm.pluginSettings["plugin"], 2)
		})

		t.Run("Should return expected environment variables from plugin settings ", func(t *testing.T) {
			pm := manager{Cfg: cfg}
			pm.extractPluginSettings()
			env := pm.pluginSettings["plugin"].ToEnv("GF_PLUGIN", []string{"GF_VERSION=6.7.0"})
			sort.Strings(env)
			require.Len(t, env, 3)
			require.EqualValues(t, []string{"GF_PLUGIN_KEY1=value1", "GF_PLUGIN_KEY2=value2", "GF_VERSION=6.7.0"}, env)
		})
	})
}
