import { load } from 'js-yaml';

import { e2e } from '@grafana/e2e';

import { selectors } from '../../public/app/plugins/datasource/grafana-azure-monitor-datasource/e2e/selectors';
import {
  AzureDataSourceJsonData,
  AzureDataSourceSecureJsonData,
  AzureQueryType,
} from '../../public/app/plugins/datasource/grafana-azure-monitor-datasource/types';

import EXAMPLE_DASHBOARD from './example-dashboards/azure-monitor.json';

const provisioningPath = `../../provisioning/datasources/azmonitor-ds.yaml`;
const e2eSelectors = e2e.getSelectors(selectors.components);

type AzureMonitorConfig = {
  secureJsonData: AzureDataSourceSecureJsonData;
  jsonData: AzureDataSourceJsonData;
};

type AzureMonitorProvision = { datasources: AzureMonitorConfig[] };

const dataSourceName = 'Azure Monitor E2E Tests';

function provisionAzureMonitorDatasources(datasources: AzureMonitorProvision[]) {
  const datasource = datasources[0].datasources[0];

  e2e()
    .intercept(/subscriptions/)
    .as('subscriptions');

  e2e.flows.addDataSource({
    type: 'Azure Monitor',
    name: dataSourceName,
    form: () => {
      e2eSelectors.configEditor.azureCloud.input().find('input').type('Azure').type('{enter}');
      // We set the log value to false here to ensure that secrets aren't printed to logs
      e2eSelectors.configEditor.tenantID.input().find('input').type(datasource.jsonData.tenantId, { log: false });
      e2eSelectors.configEditor.clientID.input().find('input').type(datasource.jsonData.clientId, { log: false });
      e2eSelectors.configEditor.clientSecret
        .input()
        .find('input')
        .type(datasource.secureJsonData.clientSecret, { log: false });
      e2eSelectors.configEditor.loadSubscriptions.button().click().wait('@subscriptions').wait(500);
    },
    expectedAlertMessage: 'Successfully connected to all Azure Monitor endpoints',
  });
}

const addAzureMonitorVariable = (
  name: string,
  type: AzureQueryType,
  isFirst: boolean,
  options?: { subscription?: string; resourceGroup?: string; namespace?: string; resource?: string }
) => {
  e2e.components.PageToolbar.item('Dashboard settings').click();
  e2e.components.Tab.title('Variables').click();
  if (isFirst) {
    e2e.pages.Dashboard.Settings.Variables.List.addVariableCTAV2().click();
  } else {
    e2e.pages.Dashboard.Settings.Variables.List.newButton().click();
  }
  e2e.pages.Dashboard.Settings.Variables.Edit.General.generalNameInputV2().clear().type(name);
  e2e.pages.Dashboard.Settings.Variables.Edit.QueryVariable.queryOptionsDataSourceSelect().type(
    `${dataSourceName}{enter}`
  );
  e2eSelectors.variableEditor.queryType
    .input()
    .find('input')
    .type(`${type.replace('Azure', '').trim()}{enter}`);
  switch (type) {
    case AzureQueryType.ResourceGroupsQuery:
      e2eSelectors.variableEditor.subscription.input().find('input').type(`${options?.subscription}{enter}`);
      break;
    case AzureQueryType.NamespacesQuery:
      e2eSelectors.variableEditor.subscription.input().find('input').type(`${options?.subscription}{enter}`);
      e2eSelectors.variableEditor.resourceGroup.input().find('input').type(`${options?.resourceGroup}{enter}`);
      break;
    case AzureQueryType.ResourceNamesQuery:
      e2eSelectors.variableEditor.subscription.input().find('input').type(`${options?.subscription}{enter}`);
      e2eSelectors.variableEditor.resourceGroup.input().find('input').type(`${options?.resourceGroup}{enter}`);
      e2eSelectors.variableEditor.namespace.input().find('input').type(`${options?.namespace}{enter}`);
      break;
    case AzureQueryType.MetricNamesQuery:
      e2eSelectors.variableEditor.subscription.input().find('input').type(`${options?.subscription}{enter}`);
      e2eSelectors.variableEditor.resourceGroup.input().find('input').type(`${options?.resourceGroup}{enter}`);
      e2eSelectors.variableEditor.namespace.input().find('input').type(`${options?.namespace}{enter}`);
      e2eSelectors.variableEditor.resource.input().find('input').type(`${options?.resource}{enter}`);
      break;
  }
  e2e.pages.Dashboard.Settings.Variables.Edit.General.submitButton().click();
  e2e.components.PageToolbar.item('Go Back').click();
};

e2e.scenario({
  describeName: 'Add Azure Monitor datasource',
  itName: 'fills out datasource connection configuration',
  scenario: () => {
    e2e()
      .readFile(provisioningPath)
      .then((azMonitorProvision: string) => {
        const yaml = load(azMonitorProvision) as AzureMonitorProvision;
        provisionAzureMonitorDatasources([yaml]);
      });
    e2e.setScenarioContext({ addedDataSources: [] });
  },
});

e2e.scenario({
  describeName: 'Create dashboard and add a panel for each query type',
  itName: 'create dashboard, add panel for metrics query, log analytics query, and ARG query',
  scenario: () => {
    e2e.flows.addDashboard({
      timeRange: {
        from: '2022-10-03 00:00:00',
        to: '2022-10-03 23:59:59',
        zone: 'Coordinated Universal Time',
      },
    });
    e2e.flows.addPanel({
      dataSourceName,
      visitDashboardAtStart: false,
      queriesForm: () => {
        e2eSelectors.queryEditor.resourcePicker.select.button().click();
        e2eSelectors.queryEditor.resourcePicker.search.input().type('azmonmetricstest{enter}');
        e2e().contains('azmonmetricstest').click();
        e2eSelectors.queryEditor.resourcePicker.apply.button().click();
        e2e().contains('microsoft.storage/storageaccounts');
        e2eSelectors.queryEditor.metricsQueryEditor.metricName.input().find('input').type('Used capacity{enter}');
      },
    });
    e2e.components.PanelEditor.applyButton().click();
    e2e.flows.addPanel({
      dataSourceName,
      visitDashboardAtStart: false,
      queriesForm: () => {
        e2eSelectors.queryEditor.header.select().find('input').type('Logs{enter}');
        e2eSelectors.queryEditor.resourcePicker.select.button().click();
        e2eSelectors.queryEditor.resourcePicker.search.input().type('azmonlogstest{enter}');
        e2e().contains('azmonlogstest').click();
        e2eSelectors.queryEditor.resourcePicker.apply.button().click();
        e2e.components.CodeEditor.container().type('AzureDiagnostics');
        e2eSelectors.queryEditor.logsQueryEditor.formatSelection.input().type('Time series{enter}');
      },
    });
    e2e.components.PanelEditor.applyButton().click();
    e2e.flows.addPanel({
      dataSourceName,
      visitDashboardAtStart: false,
      queriesForm: () => {
        e2eSelectors.queryEditor.header.select().find('input').type('Azure Resource Graph{enter}');
        e2e().wait(1000); // Need to wait for code editor to completely load
        e2e.components.CodeEditor.container().type(
          "Resources | where resourceGroup == 'cloud-plugins-e2e-test' | project name, resourceGroup"
        );
        e2e.components.PanelEditor.toggleTableView().click({ force: true });
      },
    });
  },
});

e2e.scenario({
  describeName: 'Create dashboard with template variables',
  itName: 'creates a dashboard that includes a template variable',
  scenario: () => {
    e2e.flows.addDashboard({
      timeRange: {
        from: '2022-10-03 00:00:00',
        to: '2022-10-03 23:59:59',
        zone: 'Coordinated Universal Time',
      },
    });
    addAzureMonitorVariable('subscription', AzureQueryType.SubscriptionsQuery, true);
    addAzureMonitorVariable('resourceGroups', AzureQueryType.ResourceGroupsQuery, false, {
      subscription: '$subscription',
    });
    addAzureMonitorVariable('namespaces', AzureQueryType.NamespacesQuery, false, {
      subscription: '$subscription',
      resourceGroup: '$resourceGroups',
    });
    addAzureMonitorVariable('resource', AzureQueryType.ResourceNamesQuery, false, {
      subscription: '$subscription',
      resourceGroup: '$resourceGroups',
      namespace: '$namespace',
    });
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('subscription').click();
    e2e.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts('Primary Subscription').click();
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('resourceGroups').click();
    e2e.pages.Dashboard.SubMenu.submenuItemValueDropDownOptionTexts('cloud-plugins-e2e-test').click();
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('namespaces').parent().find('button').click();
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('namespaces')
      .parent()
      .find('input')
      .type('microsoft.storage/storageaccounts{enter}');
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('resource').parent().find('button').click();
    e2e.pages.Dashboard.SubMenu.submenuItemLabels('resource').parent().find('input').type('azmonmetricstest{enter}');
    e2e.flows.addPanel({
      dataSourceName,
      visitDashboardAtStart: false,
      queriesForm: () => {
        e2eSelectors.queryEditor.resourcePicker.select.button().click();
        e2eSelectors.queryEditor.resourcePicker.advanced.collapse().click();
        e2eSelectors.queryEditor.resourcePicker.advanced.subscription.input().find('input').type('$subscription');
        e2eSelectors.queryEditor.resourcePicker.advanced.resourceGroup.input().find('input').type('$resourceGroups');
        e2eSelectors.queryEditor.resourcePicker.advanced.namespace.input().find('input').type('$namespaces');
        e2eSelectors.queryEditor.resourcePicker.advanced.resource.input().find('input').type('$resource');
        e2eSelectors.queryEditor.resourcePicker.apply.button().click();
        e2eSelectors.queryEditor.metricsQueryEditor.metricName.input().find('input').type('Transactions{enter}');
      },
    });
  },
});

e2e.scenario({
  describeName: 'Create dashboard with annotation',
  itName: 'creates a dashboard that includes an annotation',
  scenario: () => {
    e2e.flows.addDashboard({
      timeRange: {
        from: '2022-10-03 00:00:00',
        to: '2022-10-03 23:59:59',
        zone: 'Coordinated Universal Time',
      },
    });
    e2e.components.PageToolbar.item('Dashboard settings').click();
    e2e.components.Tab.title('Annotations').click();
    e2e.pages.Dashboard.Settings.Annotations.List.addAnnotationCTAV2().click();
    e2e.pages.Dashboard.Settings.Annotations.Settings.name().type('TestAnnotation');
    e2e.components.DataSourcePicker.inputV2().click().type(`${dataSourceName}{enter}`);
    e2eSelectors.queryEditor.resourcePicker.select.button().click();
    e2eSelectors.queryEditor.resourcePicker.search.input().type('azmonmetricstest');
    e2e().contains('azmonmetricstest').click();
    e2eSelectors.queryEditor.resourcePicker.apply.button().click();
    e2e().contains('microsoft.storage/storageaccounts');
    e2eSelectors.queryEditor.metricsQueryEditor.metricName.input().find('input').type('Transactions{enter}');
    e2e().get('table').contains('text').parent().find('input').click().type('Transactions (number){enter}');
    e2e.components.PageToolbar.item('Go Back').click();
    e2e.flows.addPanel({
      dataSourceName,
      visitDashboardAtStart: false,
      queriesForm: () => {
        e2eSelectors.queryEditor.resourcePicker.select.button().click();
        e2eSelectors.queryEditor.resourcePicker.search.input().type('azmonmetricstest');
        e2e().contains('azmonmetricstest').click();
        e2eSelectors.queryEditor.resourcePicker.apply.button().click();
        e2e().contains('microsoft.storage/storageaccounts');
        e2eSelectors.queryEditor.metricsQueryEditor.metricName.input().find('input').type('Used capacity{enter}');
      },
    });
  },
});

e2e.scenario({
  describeName: 'Remove datasource',
  itName: 'remove azure monitor datasource',
  scenario: () => {
    e2e.flows.deleteDataSource({ name: dataSourceName, id: '', quick: true });
  },
});
