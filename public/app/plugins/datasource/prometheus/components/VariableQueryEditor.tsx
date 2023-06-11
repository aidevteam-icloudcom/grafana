import React, { FormEvent, useEffect, useState } from 'react';

import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, Input, Select, TextArea } from '@grafana/ui';

import { PrometheusDatasource } from '../datasource';
import {
  migrateVariableEditorBackToVariableSupport,
  migrateVariableQueryToEditor,
} from '../migrations/variableMigration';
import { MetricsLabelsSection } from '../querybuilder/components/MetricsLabelsSection';
import { QueryBuilderLabelFilter } from '../querybuilder/shared/types';
import { PromVisualQuery } from '../querybuilder/types';
import {
  PromOptions,
  PromQuery,
  PromVariableQuery,
  PromVariableQueryType as QueryType,
  StandardPromVariableQuery,
} from '../types';

export const variableOptions = [
  { label: 'Label names', value: QueryType.LabelNames },
  { label: 'Label values', value: QueryType.LabelValues },
  { label: 'Metrics', value: QueryType.MetricNames },
  { label: 'Query result', value: QueryType.VarQueryResult },
  { label: 'Series query', value: QueryType.SeriesQuery },
];

export type Props = QueryEditorProps<PrometheusDatasource, PromQuery, PromOptions, PromVariableQuery>;

const refId = 'PrometheusVariableQueryEditor-VariableQuery';

export const PromVariableQueryEditor = ({ onChange, query, datasource }: Props) => {
  // to select the query type, i.e. label_names, label_values, etc.
  const [qryType, setQryType] = useState<number | undefined>(undefined);

  // list of variables for each function
  const [label, setLabel] = useState('');
  // metric is used for both label_values() and metric()
  // label_values() metric requires a whole/complete metric
  // metric() is expected to be a part of a metric string
  const [metric, setMetric] = useState('');
  // varQuery is a whole query, can include math/rates/etc
  const [varQuery, setVarQuery] = useState('');
  // seriesQuery is only a whole
  const [seriesQuery, setSeriesQuery] = useState('');

  // list of label names for label_values(), /api/v1/labels, contains the same results as label_names() function
  const [labelOptions, setLabelOptions] = useState<Array<SelectableValue<string>>>([]);

  const [labelFilters, setLabelFilters] = useState<QueryBuilderLabelFilter[]>([]);

  useEffect(() => {
    if (!query) {
      return;
    }
    // 1. Changing from standard to custom variable editor changes the string attr from expr to query
    // 2. jsonnet grafana as code passes a variable as a string
    const variableQuery = variableMigration(query);

    setQryType(variableQuery.qryType);
    setLabel(variableQuery.label ?? '');
    setMetric(variableQuery.metric ?? '');
    setLabelFilters(query.labelFilters ?? []);
    setVarQuery(variableQuery.varQuery ?? '');
    setSeriesQuery(variableQuery.seriesQuery ?? '');
  }, [query]);

  // set the label names options for the label values var query
  useEffect(() => {
    if (qryType !== QueryType.LabelValues) {
      return;
    }

    datasource.getTagKeys().then((labelNames: Array<{ text: string }>) => {
      const variables = datasource.getVariables().map((variable: string) => ({ label: variable, value: variable }));
      const names = labelNames.map(({ text }) => ({ label: text, value: text }));
      setLabelOptions([...variables, ...names]);
    });
  }, [datasource, qryType]);

  const onChangeWithVariableString = (qryType: QueryType) => {
    const queryVar = {
      qryType: qryType,
      label,
      metric,
      varQuery,
      seriesQuery,
      refId: 'PrometheusVariableQueryEditor-VariableQuery',
    };

    const queryString = migrateVariableEditorBackToVariableSupport(queryVar);

    // setting query.query prop allows for update of variable definition
    onChange({
      query: queryString,
      labelFilters: labelFilters,
      refId,
    });
  };

  const onQueryTypeChange = (newType: SelectableValue<QueryType>) => {
    setQryType(newType.value);
    if (newType.value === QueryType.LabelNames) {
      onChangeWithVariableString(newType.value);
    }
  };

  const onLabelChange = (newLabel: SelectableValue<string>) => {
    setLabel(newLabel.value ?? '');
  };

  const onMetricChange = (e: FormEvent<HTMLInputElement>) => {
    setMetric(e.currentTarget.value);
  };

  const onVarQueryChange = (e: FormEvent<HTMLTextAreaElement>) => {
    setVarQuery(e.currentTarget.value);
  };

  const onSeriesQueryChange = (e: FormEvent<HTMLInputElement>) => {
    setSeriesQuery(e.currentTarget.value);
  };

  const handleBlur = () => {
    if (qryType === QueryType.LabelNames) {
      onChangeWithVariableString(qryType);
    } else if (qryType === QueryType.LabelValues && label) {
      onChangeWithVariableString(qryType);
    } else if (qryType === QueryType.MetricNames && metric) {
      onChangeWithVariableString(qryType);
    } else if (qryType === QueryType.VarQueryResult && varQuery) {
      onChangeWithVariableString(qryType);
    } else if (qryType === QueryType.SeriesQuery && seriesQuery) {
      onChangeWithVariableString(qryType);
    }
  };

  return (
    <InlineFieldRow>
      <InlineField
        label="Query Type"
        labelWidth={20}
        tooltip={
          <div>The Prometheus data source plugin provides the following query types for template variables.</div>
        }
      >
        <Select
          placeholder="Select query type"
          aria-label="Query type"
          onChange={onQueryTypeChange}
          onBlur={handleBlur}
          value={qryType}
          options={variableOptions}
          width={25}
        />
      </InlineField>
      {qryType === QueryType.LabelValues && (
        <>
          <InlineField
            label="Label"
            labelWidth={20}
            required
            tooltip={
              <div>
                Returns a list of label values for the label name in all metrics unless the metric is specified.
              </div>
            }
          >
            <Select
              aria-label="label-select"
              onChange={onLabelChange}
              onBlur={handleBlur}
              value={label}
              options={labelOptions}
              width={25}
              allowCustomValue
            />
          </InlineField>
          <InlineField
            label="Metric"
            labelWidth={20}
            tooltip={<div>Optional: returns a list of label values for the label name in the specified metric.</div>}
          >
            <MetricsLabelsSection
              query={{ metric: metric, labels: labelFilters, operations: [] }}
              datasource={datasource}
              onChange={(update: PromVisualQuery) => {
                setMetric(update.metric);
                setLabelFilters(update.labels);
              }}
              variableEditor={true}
              onBlur={handleBlur}
            />
          </InlineField>
        </>
      )}
      {qryType === QueryType.MetricNames && (
        <>
          <InlineField
            label="Metric Regex"
            labelWidth={20}
            tooltip={<div>Returns a list of metrics matching the specified metric regex.</div>}
          >
            <Input
              type="text"
              aria-label="Metric selector"
              placeholder="Metric Regex"
              value={metric}
              onChange={onMetricChange}
              onBlur={handleBlur}
              width={25}
            />
          </InlineField>
        </>
      )}
      {qryType === QueryType.VarQueryResult && (
        <>
          <InlineField
            label="Query"
            labelWidth={20}
            tooltip={
              <div>
                Returns a list of Prometheus query results for the query. This can include Prometheus functions, i.e.
                sum(go_goroutines).
              </div>
            }
          >
            <TextArea
              type="text"
              aria-label="Prometheus Query"
              placeholder="Prometheus Query"
              value={varQuery}
              onChange={onVarQueryChange}
              onBlur={handleBlur}
              cols={100}
            />
          </InlineField>
        </>
      )}
      {qryType === QueryType.SeriesQuery && (
        <>
          <InlineField
            label="Series Query"
            labelWidth={20}
            tooltip={
              <div>
                Enter enter a metric with labels, only a metric or only labels, i.e.
                go_goroutines&#123;instance=&quot;localhost:9090&quot;&#125;, go_goroutines, or
                &#123;instance=&quot;localhost:9090&quot;&#125;. Returns a list of time series associated with the
                entered data.
              </div>
            }
          >
            <Input
              type="text"
              aria-label="Series Query"
              placeholder="Series Query"
              value={seriesQuery}
              onChange={onSeriesQueryChange}
              onBlur={handleBlur}
              width={100}
            />
          </InlineField>
        </>
      )}
    </InlineFieldRow>
  );
};

export function variableMigration(query: string | PromVariableQuery | StandardPromVariableQuery): PromVariableQuery {
  if (typeof query === 'string') {
    return migrateVariableQueryToEditor(query);
  } else if (query.query) {
    return migrateVariableQueryToEditor(query.query);
  } else {
    return query;
  }
}
