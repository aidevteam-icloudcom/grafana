package process

import (
	"context"
	"sync"
	"testing"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/backendplugin"
	"github.com/stretchr/testify/require"
)

func TestProcessManager_Start(t *testing.T) {
	t.Run("Plugin not found in registry", func(t *testing.T) {
		m := NewManager(newFakePluginRegistry(map[string]*plugins.Plugin{}))
		err := m.Start(context.Background(), "non-existing-datasource")
		require.ErrorIs(t, err, backendplugin.ErrPluginNotRegistered)
	})

	t.Run("Cannot start a core plugin", func(t *testing.T) {
		pluginID := "core-datasource"

		bp := newFakeBackendPlugin(true)
		p := createPlugin(t, bp, func(plugin *plugins.Plugin) {
			plugin.ID = pluginID
			plugin.Class = plugins.Core
			plugin.Backend = true
		})

		m := NewManager(newFakePluginRegistry(map[string]*plugins.Plugin{
			pluginID: p,
		}))
		err := m.Start(context.Background(), pluginID)
		require.NoError(t, err)
		require.Zero(t, bp.started)
	})

	t.Run("Plugin state determines process start", func(t *testing.T) {
		tcs := []struct {
			name           string
			managed        bool
			backend        bool
			signatureError *plugins.SignatureError
			expectedStart  int
		}{
			{
				name:          "Unmanaged backend plugin will not be started",
				managed:       false,
				backend:       true,
				expectedStart: 0,
			},
			{
				name:          "Managed non-backend plugin will not be started",
				managed:       false,
				backend:       true,
				expectedStart: 0,
			},
			{
				name:    "Managed backend plugin with signature error will not be started",
				managed: true,
				backend: true,
				signatureError: &plugins.SignatureError{
					SignatureStatus: plugins.SignatureUnsigned,
				},
				expectedStart: 0,
			},
			{
				name:          "Managed backend plugin with no signature errors will be started",
				managed:       true,
				backend:       true,
				expectedStart: 1,
			},
		}
		for _, tc := range tcs {
			t.Run(tc.name, func(t *testing.T) {
				bp := newFakeBackendPlugin(tc.managed)
				p := createPlugin(t, bp, func(plugin *plugins.Plugin) {
					plugin.Backend = tc.backend
					plugin.SignatureError = tc.signatureError
				})

				m := NewManager(newFakePluginRegistry(map[string]*plugins.Plugin{
					p.ID: p,
				}))

				err := m.Start(context.Background(), p.ID)
				require.NoError(t, err)
				require.Equal(t, tc.expectedStart, bp.started)
			})
		}
	})
}

func TestProcessManager_Stop(t *testing.T) {

}

func TestProcessManager_ManagedBackendPluginLifecycle(t *testing.T) {
	bp := newFakeBackendPlugin(true)
	p := createPlugin(t, bp, func(plugin *plugins.Plugin) {
		plugin.Backend = true
	})

	m := NewManager(newFakePluginRegistry(map[string]*plugins.Plugin{
		p.ID: p,
	}))

	err := m.Start(context.Background(), p.ID)
	require.NoError(t, err)
	require.Equal(t, 1, bp.started)

	t.Run("When plugin process is killed, the process is restarted", func(t *testing.T) {
		pCtx := context.Background()
		cCtx, cancel := context.WithCancel(pCtx)
		var wgRun sync.WaitGroup
		wgRun.Add(1)
		var runErr error
		go func() {
			runErr = m.Run(cCtx)
			wgRun.Done()
		}()

		var wgKill sync.WaitGroup
		wgKill.Add(1)
		go func() {
			bp.kill() // manually kill process
			for {
				if !bp.Exited() {
					break
				}
			}
			wgKill.Done()
		}()
		wgKill.Wait()
		require.Equal(t, 2, bp.started)
		require.Equal(t, 0, bp.stopped)

		t.Run("When context is cancelled the plugin is stopped", func(t *testing.T) {
			cancel()
			wgRun.Wait()
			require.ErrorIs(t, runErr, context.Canceled)
			require.Equal(t, 2, bp.started)
			require.Equal(t, 1, bp.stopped)
		})
	})
}

type fakePluginRegistry struct {
	store map[string]*plugins.Plugin
}

func newFakePluginRegistry(m map[string]*plugins.Plugin) *fakePluginRegistry {
	return &fakePluginRegistry{
		store: m,
	}
}

func (f *fakePluginRegistry) Plugin(_ context.Context, id string) (*plugins.Plugin, bool) {
	p, exists := f.store[id]
	return p, exists
}

func (f *fakePluginRegistry) Plugins(_ context.Context) []*plugins.Plugin {
	var res []*plugins.Plugin

	for _, p := range f.store {
		res = append(res, p)
	}
	return res
}

func (f *fakePluginRegistry) Add(_ context.Context, p *plugins.Plugin) error {
	f.store[p.ID] = p
	return nil
}

func (f *fakePluginRegistry) Remove(_ context.Context, id string) error {
	delete(f.store, id)
	return nil
}

type fakeBackendPlugin struct {
	managed bool

	started        int
	stopped        int
	decommissioned bool
	exited         bool

	mutex sync.RWMutex
	backendplugin.Plugin
}

func newFakeBackendPlugin(managed bool) *fakeBackendPlugin {
	return &fakeBackendPlugin{
		managed: managed,
	}
}

func (p *fakeBackendPlugin) Start(_ context.Context) error {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	p.exited = false
	p.started++
	return nil
}

func (p *fakeBackendPlugin) Stop(_ context.Context) error {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	p.exited = true
	p.stopped++
	return nil
}

func (p *fakeBackendPlugin) IsDecommissioned() bool {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	return p.decommissioned
}

func (p *fakeBackendPlugin) IsManaged() bool {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	return p.managed
}

func (p *fakeBackendPlugin) Exited() bool {
	p.mutex.RLock()
	defer p.mutex.RUnlock()
	return p.exited
}

func (p *fakeBackendPlugin) kill() {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	p.exited = true
}

func createPlugin(t *testing.T, bp backendplugin.Plugin, cbs ...func(p *plugins.Plugin)) *plugins.Plugin {
	t.Helper()

	p := &plugins.Plugin{
		Class: plugins.External,
		JSONData: plugins.JSONData{
			ID: "test-datasource",
		},
	}

	p.SetLogger(log.NewNopLogger())
	p.RegisterClient(bp)

	for _, cb := range cbs {
		cb(p)
	}

	return p
}
