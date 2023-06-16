import { findByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import React from 'react';

import { DataSourceInstanceSettings, DataSourcePluginMeta, PluginMetaInfo, PluginType } from '@grafana/data';
import { ModalRoot, ModalsProvider } from '@grafana/ui';
import config from 'app/core/config';
import { defaultFileUploadQuery } from 'app/plugins/datasource/grafana/types';

import { DataSourceDropdown } from './DataSourceDropdown';
import * as utils from './utils';

const pluginMetaInfo: PluginMetaInfo = {
  author: { name: '' },
  description: '',
  screenshots: [],
  version: '',
  updated: '',
  links: [],
  logos: { small: '', large: '' },
};

function createPluginMeta(name: string, builtIn: boolean): DataSourcePluginMeta {
  return { builtIn, name, id: name, type: PluginType.datasource, baseUrl: '', info: pluginMetaInfo, module: '' };
}

function createDS(name: string, id: number, builtIn: boolean): DataSourceInstanceSettings {
  return {
    name: name,
    uid: name + 'uid',
    meta: createPluginMeta(name, builtIn),
    id,
    access: 'direct',
    jsonData: {},
    type: '',
    readOnly: true,
  };
}

const mockDS = createDS('mockDS', 1, false);
const xMockDS = createDS('xMockDS', 2, false);
const builtInMockDS = createDS('builtInMockDS', 3, true);

const mockDSList = [mockDS, xMockDS, builtInMockDS];

const setup = (onChange = () => {}, current = mockDS.name) => {
  const props = { onChange, current };
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  return render(<DataSourceDropdown {...props}></DataSourceDropdown>);
};

async function setupOpenDropdown(user: UserEvent, onChange?: () => void, current?: string) {
  const dropdown = setup(onChange, current);
  const searchBox = dropdown.container.querySelector('input');
  expect(searchBox).toBeInTheDocument();
  await user.click(searchBox!);
}

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');
  return {
    ...actual,
    getTemplateSrv: () => {
      return {
        getVariables: () => [{ id: 'foo', type: 'datasource' }],
      };
    },
  };
});

jest.mock('@grafana/runtime/src/services/dataSourceSrv', () => {
  return {
    getDataSourceSrv: () => ({
      getList: getListMock,
      getInstanceSettings: getInstanceSettingsMock,
    }),
  };
});

const pushRecentlyUsedDataSourceMock = jest.fn();
jest.mock('../../hooks', () => {
  const actual = jest.requireActual('../../hooks');
  return {
    ...actual,
    useRecentlyUsedDataSources: () => [[xMockDS.name], pushRecentlyUsedDataSourceMock],
  };
});

const getListMock = jest.fn();
const getInstanceSettingsMock = jest.fn();
beforeEach(() => {
  getListMock.mockReturnValue(mockDSList);
  getInstanceSettingsMock.mockReturnValue(mockDS);
});

describe('DataSourceDropdown', () => {
  it('should render', () => {
    expect(() => setup()).not.toThrow();
  });

  describe('configuration', () => {
    const user = userEvent.setup();

    it('should call the dataSourceSrv.getDatasourceList with the correct filters', async () => {
      const filters = {
        mixed: true,
        tracing: true,
        dashboard: true,
        metrics: true,
        type: 'foo',
        annotations: true,
        variables: true,
        alerting: true,
        pluginId: true,
        logs: true,
      };

      const props = {
        onChange: () => {},
        current: mockDS.name,
        ...filters,
      };
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
      const dropdown = render(<DataSourceDropdown {...props}></DataSourceDropdown>);

      const searchBox = dropdown.container.querySelector('input');
      expect(searchBox).toBeInTheDocument();
      await user.click(searchBox!);
      expect(getListMock.mock.lastCall[0]).toEqual(filters);
    });

    it('should display the current ds on top and selected', async () => {
      //Mock ds is set as current, it appears on top, and is selected
      getInstanceSettingsMock.mockReturnValue(mockDS);
      await setupOpenDropdown(user, jest.fn(), mockDS.name);
      let cards = await screen.findAllByTestId('data-source-card');
      expect(await findByText(cards[0], mockDS.name, { selector: 'span' })).toBeInTheDocument();
      expect(cards[0].dataset.selecteditem).toEqual('true');

      //xMock ds is set as current, it appears on top, and is selected
      getInstanceSettingsMock.mockReturnValue(xMockDS);
      await setupOpenDropdown(user, jest.fn(), xMockDS.name);
      cards = await screen.findAllByTestId('data-source-card');
      expect(await findByText(cards[0], xMockDS.name, { selector: 'span' })).toBeInTheDocument();

      expect(cards[0].dataset.selecteditem).toEqual('true');
    });

    it('should get the sorting function using the correct paramters', async () => {
      //The actual sorting is tested in utils.test but let's make sure we're calling getDataSourceCompareFn with the correct parameters
      const spy = jest.spyOn(utils, 'getDataSourceCompareFn');
      await setupOpenDropdown(user);

      expect(spy.mock.lastCall).toEqual([mockDS, [xMockDS.name], ['${foo}']]);
    });
  });

  describe('interactions', () => {
    const user = userEvent.setup();

    it('should open when clicked', async () => {
      await setupOpenDropdown(user);
      expect(await screen.findByText(mockDS.name, { selector: 'span' })).toBeInTheDocument();
    });

    it('should call onChange when a data source is clicked', async () => {
      const onChange = jest.fn();
      await setupOpenDropdown(user, onChange);

      await user.click(await screen.findByText(xMockDS.name, { selector: 'span' }));
      expect(onChange.mock.lastCall[0]['name']).toEqual(xMockDS.name);
      expect(screen.queryByText(mockDS.name, { selector: 'span' })).toBeNull();
    });

    it('should push recently used datasources when a data source is clicked', async () => {
      const onChange = jest.fn();
      await setupOpenDropdown(user, onChange);

      await user.click(await screen.findByText(xMockDS.name, { selector: 'span' }));
      expect(pushRecentlyUsedDataSourceMock.mock.lastCall[0]).toEqual(xMockDS);
    });

    it('should be navigatable by keyboard', async () => {
      const onChange = jest.fn();
      await setupOpenDropdown(user, onChange);

      //Dropdown open, first element is selected
      let mockDSElement = getCard(await screen.findByText(mockDS.name, { selector: 'span' }));
      expect(mockDSElement?.dataset.selecteditem).toEqual('true');

      await user.keyboard('[ArrowDown]');
      //Arrow down, second item is selected
      const xMockDSElement = getCard(await screen.findByText(xMockDS.name, { selector: 'span' }));
      expect(xMockDSElement?.dataset.selecteditem).toEqual('true');
      mockDSElement = getCard(await screen.findByText(mockDS.name, { selector: 'span' }));
      expect(mockDSElement?.dataset.selecteditem).toEqual('false');

      await user.keyboard('[ArrowUp]');
      //Arrow up, first item is selected again
      mockDSElement = getCard(await screen.findByText(mockDS.name, { selector: 'span' }));
      expect(mockDSElement?.dataset.selecteditem).toEqual('true');

      await user.keyboard('[ArrowDown]');
      await user.keyboard('[Enter]');
      //Arrow down to navigate to xMock, enter to select it. Assert onChange called with correct DS and dropdown closed.
      expect(onChange.mock.lastCall[0]['name']).toEqual(xMockDS.name);
      expect(screen.queryByText(mockDS.name, { selector: 'span' })).toBeNull();
    });

    it('should be searchable', async () => {
      await setupOpenDropdown(user);

      await user.keyboard(xMockDS.name); //Search for xMockDS

      expect(screen.queryByText(mockDS.name, { selector: 'span' })).toBeNull();
      expect(await screen.findByText(xMockDS.name, { selector: 'span' })).toBeInTheDocument();

      await user.keyboard('foobarbaz'); //Search for a DS that should not exist

      expect(await screen.findByText('Configure a new data source')).toBeInTheDocument();
    });

    it('should call onChange with the default query when add csv is clicked', async () => {
      config.featureToggles.editPanelCSVDragAndDrop = true;
      const onChange = jest.fn();
      await setupOpenDropdown(user, onChange);

      await user.click(await screen.findByText('Add csv or spreadsheet'));

      expect(onChange.mock.lastCall[1]).toEqual([defaultFileUploadQuery]);
      expect(screen.queryByText('Open advanced data source picker')).toBeNull(); //Drop down is closed
      config.featureToggles.editPanelCSVDragAndDrop = false;
    });

    it('should open the modal when open advanced is clicked', async () => {
      const props = { onChange: jest.fn(), current: mockDS.name };
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
      render(
        <ModalsProvider>
          <DataSourceDropdown {...props}></DataSourceDropdown>
          <ModalRoot />
        </ModalsProvider>
      );

      const searchBox = await screen.findByRole('textbox');
      expect(searchBox).toBeInTheDocument();
      await user.click(searchBox!);
      await user.click(await screen.findByText('Open advanced data source picker'));
      expect(await screen.findByText('Select data source')); //Data source modal is open
      expect(screen.queryByText('Open advanced data source picker')).toBeNull(); //Drop down is closed
    });
  });
});

function getCard(element: HTMLElement) {
  return element.parentElement?.parentElement?.parentElement?.parentElement;
}
