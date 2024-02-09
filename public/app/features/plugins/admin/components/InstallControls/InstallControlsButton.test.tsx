import { render, screen } from '@testing-library/react';
import React from 'react';
import { TestProvider } from 'test/helpers/TestProvider';

import { PluginSignatureStatus } from '@grafana/data';
import { config } from '@grafana/runtime';
import { configureStore } from 'app/store/configureStore';

import { getPluginsStateMock } from '../../__mocks__';
import { CatalogPlugin, PluginStatus } from '../../types';

import { InstallControlsButton } from './InstallControlsButton';

const plugin: CatalogPlugin = {
  description: 'The test plugin',
  downloads: 5,
  id: 'test-plugin',
  info: {
    logos: { small: '', large: '' },
  },
  name: 'Testing Plugin',
  orgName: 'Test',
  popularity: 0,
  signature: PluginSignatureStatus.valid,
  publishedAt: '2020-09-01',
  updatedAt: '2021-06-28',
  hasUpdate: false,
  isInstalled: false,
  isCore: false,
  isDev: false,
  isEnterprise: false,
  isDisabled: false,
  isDeprecated: false,
  isPublished: true,
};

function setup(opts: { angularSupportEnabled: boolean; angularDetected: boolean }) {
  config.angularSupportEnabled = opts.angularSupportEnabled;
  render(
    <TestProvider>
      <InstallControlsButton
        plugin={{ ...plugin, angularDetected: opts.angularDetected }}
        pluginStatus={PluginStatus.INSTALL}
      />
    </TestProvider>
  );
}

describe('InstallControlsButton', () => {
  let oldAngularSupportEnabled = config.angularSupportEnabled;
  afterAll(() => {
    config.angularSupportEnabled = oldAngularSupportEnabled;
  });

  describe.each([{ angularSupportEnabled: true }, { angularSupportEnabled: false }])(
    'angular support is $angularSupportEnabled',
    ({ angularSupportEnabled }) => {
      it.each([
        { angularDetected: true, expectEnabled: angularSupportEnabled },
        { angularDetected: false, expectEnabled: true },
      ])('angular detected is $angularDetected', ({ angularDetected, expectEnabled }) => {
        setup({ angularSupportEnabled, angularDetected });

        const el = screen.getByRole('button');
        expect(el).toHaveTextContent(/install/i);
        expect(el).toBeVisible();
        if (expectEnabled) {
          expect(el).toBeEnabled();
        } else {
          expect(el).toBeDisabled();
        }
      });
    }
  );

  it("should allow to uninstall a plugin even if it's unpublished", () => {
    render(
      <TestProvider>
        <InstallControlsButton plugin={{ ...plugin, isPublished: false }} pluginStatus={PluginStatus.UNINSTALL} />
      </TestProvider>
    );
    const el = screen.getByRole('button');
    expect(el).toHaveTextContent(/uninstall/i);
    expect(el).toBeVisible();
  });

  it('should not render install or upgrade buttons if the plugin is unpublished', () => {
    render(
      <TestProvider>
        <InstallControlsButton plugin={{ ...plugin, isPublished: false }} pluginStatus={PluginStatus.INSTALL} />
      </TestProvider>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  describe('uninstall button on prem', () => {
    const store = configureStore({
      plugins: getPluginsStateMock([]),
    });

    it('should be disable when is Installing', () => {
      store.dispatch({ type: 'plugins/uninstall/pending' });
      render(
        <TestProvider store={store}>
          <InstallControlsButton plugin={{ ...plugin }} pluginStatus={PluginStatus.UNINSTALL} />
        </TestProvider>
      );
      const button = screen.getByText('Uninstalling').closest('button');
      expect(button).toBeDisabled();
    });

    it('should be enabled when not is Installing', () => {
      store.dispatch({ type: 'plugins/uninstall/fulfilled', payload: { id: '', changes: {} } });
      render(
        <TestProvider store={store}>
          <InstallControlsButton plugin={{ ...plugin }} pluginStatus={PluginStatus.UNINSTALL} />
        </TestProvider>
      );
      const button = screen.getByText('Uninstall').closest('button');
      expect(button).toBeEnabled();
    });
  });

  describe('uninstall button on manage instance', () => {
    const oldFeatureTogglesManagedPluginsInstall = config.featureToggles.managedPluginsInstall;
    const oldPluginAdminExternalManageEnabled = config.pluginAdminExternalManageEnabled;

    beforeAll(() => {
      config.featureToggles.managedPluginsInstall = true;
      config.pluginAdminExternalManageEnabled = true;
    });

    afterAll(() => {
      config.featureToggles.managedPluginsInstall = oldFeatureTogglesManagedPluginsInstall;
      config.pluginAdminExternalManageEnabled = oldPluginAdminExternalManageEnabled;
    });

    const store = configureStore({
      plugins: getPluginsStateMock([]),
    });

    it('should be disabled when is Installing=false but isUninstallingFromInstance=true', () => {
      store.dispatch({ type: 'plugins/uninstall/fulfilled', payload: { id: '', changes: {} } });
      render(
        <TestProvider store={store}>
          <InstallControlsButton
            plugin={{ ...plugin, isUninstallingFromInstance: true }}
            pluginStatus={PluginStatus.UNINSTALL}
          />
        </TestProvider>
      );
      const button = screen.getByText('Uninstall').closest('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when is Installing=false but isUninstallingFromInstance=false', () => {
      store.dispatch({ type: 'plugins/uninstall/fulfilled', payload: { id: '', changes: {} } });
      render(
        <TestProvider store={store}>
          <InstallControlsButton
            plugin={{ ...plugin, isUninstallingFromInstance: false }}
            pluginStatus={PluginStatus.UNINSTALL}
          />
        </TestProvider>
      );
      const button = screen.getByText('Uninstall').closest('button');
      expect(button).toBeEnabled();
    });
  });
});
