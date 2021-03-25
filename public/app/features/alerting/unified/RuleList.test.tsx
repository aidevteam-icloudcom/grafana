import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { configureStore } from 'app/store/configureStore';
import { Provider } from 'react-redux';
import { RuleList } from './RuleList';
import { byTestId, byText } from 'testing-library-selector';
import { typeAsJestMock } from 'test/helpers/typeAsJestMock';
import { getAllDataSources } from './utils/config';
import { fetchRules } from './api/prometheus';
import {
  mockDatasource,
  mockPromAlert,
  mockPromAlertingRule,
  mockPromRecordingRule,
  mockPromRuleGroup,
  mockPromRuleNamespace,
} from './mocks';
import { DataSourceType } from './utils/datasource';
import { SerializedError } from '@reduxjs/toolkit';
import { PromAlertingRuleState } from 'app/types/unified-alerting-dto';
import userEvent from '@testing-library/user-event';

jest.mock('./api/prometheus');
jest.mock('./utils/config');

const mocks = {
  getAllDatasourcesMock: typeAsJestMock(getAllDataSources),

  api: {
    fetchRules: typeAsJestMock(fetchRules),
  },
};

const renderRuleList = () => {
  const store = configureStore();

  return render(
    <Provider store={store}>
      <RuleList />
    </Provider>
  );
};

const datasources = {
  prom: mockDatasource({
    name: 'Prometheus',
    type: DataSourceType.Prometheus,
  }),
  loki: mockDatasource({
    name: 'Loki',
    type: DataSourceType.Loki,
  }),
  promBroken: mockDatasource({
    name: 'Prometheus-broken',
    type: DataSourceType.Prometheus,
  }),
};

const ui = {
  ruleGroup: byTestId('rule-group'),
  cloudRulesSourceErrors: byTestId('cloud-rulessource-errors'),
  groupCollapseToggle: byTestId('group-collapse-toggle'),
  ruleCollapseToggle: byTestId('rule-collapse-toggle'),
  alertCollapseToggle: byTestId('alert-collapse-toggle'),
  rulesTable: byTestId('rules-table'),
};

describe('RuleList', () => {
  afterEach(() => jest.resetAllMocks());

  it('load & show rule groups from multiple cloud datasources', async () => {
    mocks.getAllDatasourcesMock.mockReturnValue(Object.values(datasources));

    mocks.api.fetchRules.mockImplementation((datasourceName: string) => {
      if (datasourceName === datasources.prom.name) {
        return Promise.resolve([
          mockPromRuleNamespace({
            name: 'default',
            datasourceName: datasources.prom.name,
            groups: [
              mockPromRuleGroup({
                name: 'group-2',
              }),
              mockPromRuleGroup({
                name: 'group-1',
              }),
            ],
          }),
        ]);
      } else if (datasourceName === datasources.loki.name) {
        return Promise.resolve([
          mockPromRuleNamespace({
            name: 'default',
            datasourceName: datasources.loki.name,
            groups: [
              mockPromRuleGroup({
                name: 'group-1',
              }),
            ],
          }),
          mockPromRuleNamespace({
            name: 'lokins',
            datasourceName: datasources.loki.name,
            groups: [
              mockPromRuleGroup({
                name: 'group-1',
              }),
            ],
          }),
        ]);
      } else if (datasourceName === datasources.promBroken.name) {
        return Promise.reject({ message: 'this datasource is broken' } as SerializedError);
      }
      return Promise.reject(new Error(`unexpected datasourceName: ${datasourceName}`));
    });

    await renderRuleList();

    await waitFor(() => expect(mocks.api.fetchRules).toHaveBeenCalledTimes(3));
    const groups = await ui.ruleGroup.findAll();
    expect(groups).toHaveLength(4);

    expect(groups[0]).toHaveTextContent('default > group-1');
    expect(groups[1]).toHaveTextContent('default > group-1');
    expect(groups[2]).toHaveTextContent('default > group-2');
    expect(groups[3]).toHaveTextContent('lokins > group-1');

    const errors = await ui.cloudRulesSourceErrors.find();

    expect(errors).toHaveTextContent('Failed to load rules from Prometheus-broken: this datasource is broken');
  });

  it('expand rule group, rule and alert details', async () => {
    mocks.getAllDatasourcesMock.mockReturnValue([datasources.prom]);
    mocks.api.fetchRules.mockResolvedValue([
      mockPromRuleNamespace({
        groups: [
          mockPromRuleGroup({
            name: 'group-1',
          }),
          mockPromRuleGroup({
            name: 'group-2',
            rules: [
              mockPromRecordingRule({
                name: 'recordingrule',
              }),
              mockPromAlertingRule({
                name: 'alertingrule',
                labels: {
                  severity: 'warning',
                  foo: 'bar',
                },
                query: 'topk(5, foo)[5m]',
                annotations: {
                  message: 'great alert',
                },
                alerts: [
                  mockPromAlert({
                    labels: {
                      foo: 'bar',
                      severity: 'warning',
                    },
                    value: '2e+10',
                    annotations: {
                      message: 'first alert message',
                    },
                  }),
                  mockPromAlert({
                    labels: {
                      foo: 'baz',
                      severity: 'error',
                    },
                    value: '3e+11',
                    annotations: {
                      message: 'first alert message',
                    },
                  }),
                ],
              }),
              mockPromAlertingRule({
                name: 'p-rule',
                alerts: [],
                state: PromAlertingRuleState.Pending,
              }),
              mockPromAlertingRule({
                name: 'i-rule',
                alerts: [],
                state: PromAlertingRuleState.Inactive,
              }),
            ],
          }),
        ],
      }),
    ]);

    await renderRuleList();

    const groups = await ui.ruleGroup.findAll();
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveTextContent('1 rule');
    expect(groups[1]).toHaveTextContent('4 rules: 1 firing, 1 pending');

    // expand second group to see rules table
    expect(ui.rulesTable.query()).not.toBeInTheDocument();
    userEvent.click(ui.groupCollapseToggle.get(groups[1]));
    const table = await ui.rulesTable.find(groups[1]);

    // check that rule rows are rendered properly
    let ruleRows = table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr');
    expect(ruleRows).toHaveLength(4);

    expect(ruleRows[0]).toHaveTextContent('n/a');
    expect(ruleRows[0]).toHaveTextContent('recordingrule');

    expect(ruleRows[1]).toHaveTextContent('firing');
    expect(ruleRows[1]).toHaveTextContent('alertingrule');

    expect(ruleRows[2]).toHaveTextContent('pending');
    expect(ruleRows[2]).toHaveTextContent('p-rule');

    expect(ruleRows[3]).toHaveTextContent('inactive');
    expect(ruleRows[3]).toHaveTextContent('i-rule');

    expect(byText('Labels').query()).not.toBeInTheDocument();

    // expand alert details
    userEvent.click(ui.ruleCollapseToggle.get(ruleRows[1]));

    ruleRows = table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr');
    expect(ruleRows).toHaveLength(5);

    const ruleDetails = ruleRows[2];

    expect(ruleDetails).toHaveTextContent('Labelsseverity=warningfoo=bar');
    expect(ruleDetails).toHaveTextContent('Expressiontopk ( 5 , foo ) [ 5m ]');
    expect(ruleDetails).toHaveTextContent('messagegreat alert');
    expect(ruleDetails).toHaveTextContent('Matching instances');

    // finally, check instances table
    const instancesTable = ruleDetails.querySelector('table');
    expect(instancesTable).toBeInTheDocument();
    let instanceRows = instancesTable?.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr');
    expect(instanceRows).toHaveLength(2);

    expect(instanceRows![0]).toHaveTextContent('firingfoo=barseverity=warning2021-03-18 13:47:05');
    expect(instanceRows![1]).toHaveTextContent('firingfoo=bazseverity=error2021-03-18 13:47:05');

    // expand details of an instance
    userEvent.click(ui.alertCollapseToggle.get(instanceRows![0]));
    instanceRows = instancesTable?.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')!;
    expect(instanceRows).toHaveLength(3);

    const alertDetails = instanceRows[1];
    expect(alertDetails).toHaveTextContent('Value2e+10');
    expect(alertDetails).toHaveTextContent('messagefirst alert message');

    // collapse everything again
    userEvent.click(ui.alertCollapseToggle.get(instanceRows![0]));
    expect(instancesTable?.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')).toHaveLength(2);
    userEvent.click(ui.ruleCollapseToggle.get(ruleRows[1]));
    expect(table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')).toHaveLength(4);
    userEvent.click(ui.groupCollapseToggle.get(groups[1]));
    expect(ui.rulesTable.query()).not.toBeInTheDocument();
  });
});
