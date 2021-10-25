import { SelectableValue } from '@grafana/data';
import { Alert, InlineField, Input, Select } from '@grafana/ui';
import React, { ChangeEvent, useState } from 'react';
import { AzureMonitorQuery, AzureQueryType } from '../../types';
import LogsQueryEditor from '../LogsQueryEditor';
import DataSource from '../../datasource';
import useLastError from '../../utils/useLastError';
import { Space } from '../Space';

export const migrateStringQueriesToObjectQueries = (
  rawQuery: string | AzureMonitorQuery,
  options: { datasource: DataSource }
): AzureMonitorQuery => {
  // no need to migrate already migrated queries
  if (typeof rawQuery !== 'string') {
    return rawQuery;
  }

  if (options.datasource.azureMonitorDatasource.isGrafanaTemplateVariableFnQuery(rawQuery)) {
    return {
      refId: 'A',
      queryType: AzureQueryType.GrafanaTemplateVariableFn,
      grafanaTemplateVariableFn: {
        query: rawQuery,
      },
      azureLogAnalytics: {
        query: undefined,
      },
    };
  } else {
    const createDefaultResourceAndWorkspace = () => {
      const defaultWorkspaceId = options.datasource.azureLogAnalyticsDatasource.getDeprecatedDefaultWorkSpace();
      if (defaultWorkspaceId) {
        return { resource: '', workspace: defaultWorkspaceId };
      }
      return { resource: '', workspace: '' };
    };

    return {
      refId: 'A',
      queryType: AzureQueryType.LogAnalytics,
      azureLogAnalytics: {
        query: rawQuery,
        ...createDefaultResourceAndWorkspace(),
      },
      grafanaTemplateVariableFn: {
        query: undefined,
      },
      subscription: options.datasource.azureMonitorDatasource.defaultSubscriptionId,
    };
  }
};

const AZURE_QUERY_VARIABLE_TYPE_OPTIONS = [
  { label: 'Grafana Query Function', value: AzureQueryType.GrafanaTemplateVariableFn },
  { label: 'Logs', value: AzureQueryType.LogAnalytics },
];

const GrafanaTemplateVariableFnInput = ({
  query,
  updateQuery,
}: {
  query: AzureMonitorQuery;
  updateQuery: (val: AzureMonitorQuery) => void;
}) => {
  const [inputVal, setInputVal] = useState(query.grafanaTemplateVariableFn?.query || '');
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputVal(event.target.value);
  };
  const onBlur = () => {
    updateQuery({
      ...query,
      grafanaTemplateVariableFn: {
        query: inputVal,
      },
    });
  };
  return (
    <InlineField label="Grafana template variable function">
      <Input
        placeholder={'type a grafana template variable function, ex: Subscriptions()'}
        value={inputVal}
        onChange={onChange}
        onBlur={onBlur}
      />
    </InlineField>
  );
};
type Props = {
  query: AzureMonitorQuery | string;
  onChange: (query: AzureMonitorQuery | string) => void;
  onRunQuery: () => void;
  datasource: DataSource;
};
const VariableEditor = (props: Props) => {
  const migratedQuery = migrateStringQueriesToObjectQueries(props.query, { datasource: props.datasource });
  const [query, setQuery] = useState(migratedQuery);
  const onQueryTypeChange = (selectableValue: SelectableValue) => {
    if (selectableValue.value) {
      setQuery({
        ...query,
        queryType: selectableValue.value,
      });
    }
  };
  const onLogsQueryChange = (queryChange: AzureMonitorQuery) => {
    setQuery(queryChange);

    // only hit backend if there's something to query (prevents error when selecting the resource before pinging a query)
    if (queryChange.azureLogAnalytics?.query) {
      props.onChange(queryChange);
    }
  };

  const [errorMessage, setError] = useLastError();

  const variableOptionGroup = {
    label: 'Template Variables',
    // TODO: figure out a way to filter out the current variable from the variables list
    // options: props.datasource.getVariables().map((v) => ({ label: v, value: v })),
    options: [],
  };

  return (
    <>
      <InlineField label="Select query type">
        <Select
          onChange={onQueryTypeChange}
          options={AZURE_QUERY_VARIABLE_TYPE_OPTIONS}
          width={25}
          value={query.queryType}
        />
      </InlineField>
      {query.queryType === AzureQueryType.LogAnalytics && (
        <>
          <LogsQueryEditor
            subscriptionId={query.subscription}
            query={query}
            datasource={props.datasource}
            onChange={onLogsQueryChange}
            variableOptionGroup={variableOptionGroup}
            setError={setError}
            hideFormatAs={true}
          />
          {errorMessage && (
            <>
              <Space v={2} />
              <Alert severity="error" title="An error occurred while requesting metadata from Azure Monitor">
                {errorMessage}
              </Alert>
            </>
          )}
        </>
      )}
      {query.queryType === AzureQueryType.GrafanaTemplateVariableFn && (
        <GrafanaTemplateVariableFnInput query={query} updateQuery={props.onChange} />
      )}
    </>
  );
};

export default VariableEditor;
