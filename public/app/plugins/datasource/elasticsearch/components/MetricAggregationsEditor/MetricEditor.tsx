import { MetricFindValue, SelectableValue } from '@grafana/data';
import { InlineField, Segment, SegmentAsync, useTheme } from '@grafana/ui';
import { cx } from 'emotion';
import React, { FunctionComponent } from 'react';
import { useDatasource, useQuery } from '../ElasticsearchQueryContext';
import { useDispatch } from '../../hooks/useStatelessReducer';
import { getStyles } from './styles';
import { marginZero } from '../styles';
import { ToggleVisibilityButton } from '../ToggleVisibilityButton';
import { SettingsEditor } from './SettingsEditor';
import { MetricAggregationAction } from './state/types';
import { metricAggregationConfig } from './utils';
import { changeMetricField, changeMetricType, toggleMetricVisibility } from './state/actions';
import { MetricPicker } from '../MetricPicker';
import { QueryEditorRow } from '../QueryEditorRow';
import {
  isMetricAggregationWithField,
  isMetricAggregationWithSettings,
  isPipelineAggregation,
  isPipelineAggregationWithMultipleBucketPaths,
  MetricAggregation,
  MetricAggregationType,
} from './aggregations';

const toOption = (metric: MetricAggregation) => ({
  label: metricAggregationConfig[metric.type].label,
  value: metric.type,
});

const toSelectableValue = ({ value, text }: MetricFindValue): SelectableValue<string> => ({
  label: text,
  value: `${value || text}`,
});

interface Props {
  value: MetricAggregation;
}

// If a metric is a Pipeline Aggregation (https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-pipeline.html)
// it doesn't make sense to show it in the type picker when there is no non-pipeline-aggregation previously selected
// as they work on the outputs produced from other aggregations rather than from documents or fields.
// This means we should filter them out from the type picker if there's no other "basic" aggregation before the current one.
const isBasicAggregation = (metric: MetricAggregation) => !metricAggregationConfig[metric.type].isPipelineAgg;

const getTypeOptions = (
  previousMetrics: MetricAggregation[],
  esVersion: number
): Array<SelectableValue<MetricAggregationType>> => {
  // we'll include Pipeline Aggeregations only if at least one previous metric is a "Basic" one
  const includePipelineAggregations = previousMetrics.some(isBasicAggregation);

  return (
    Object.entries(metricAggregationConfig)
      // Only showing metrics type supported by the configured version of ES
      .filter(([_, { minVersion = 0, maxVersion = esVersion }]) => {
        // TODO: Double check this
        return esVersion >= minVersion && esVersion <= maxVersion;
      })
      // Filtering out Pipeline Aggragations if there's no basic metric selected before
      .filter(([_, config]) => includePipelineAggregations || !config.isPipelineAgg)
      .map(([key, { label }]) => ({
        label,
        value: key as MetricAggregationType,
      }))
  );
};

export const MetricEditor: FunctionComponent<Props> = ({ value }) => {
  const styles = getStyles(useTheme(), !!value.hide);
  const datasource = useDatasource();
  const query = useQuery();
  const dispatch = useDispatch<MetricAggregationAction>();

  const previousMetrics = query.metrics!.slice(
    0,
    query.metrics!.findIndex(m => m.id === value.id)
  );

  // FIXME: This could be common with the one in BucketAggregationEditor
  const getFields = async () => {
    const get = () => {
      if (value.type === 'cardinality') {
        return datasource.getFields();
      }
      return datasource.getFields('number');
    };

    return (await get()).map(toSelectableValue);
  };

  return (
    <QueryEditorRow>
      <InlineField label={`Metric (${value.id})`} labelWidth={15} className={cx(styles.color)}>
        <Segment
          className={cx(styles.color, marginZero)}
          options={getTypeOptions(previousMetrics, datasource.esVersion)}
          onChange={e => dispatch(changeMetricType(value.id, e.value!))}
          value={toOption(value)}
        />
      </InlineField>

      {isMetricAggregationWithField(value) && !isPipelineAggregation(value) && (
        <SegmentAsync
          className={cx(styles.color)}
          loadOptions={getFields}
          onChange={e => dispatch(changeMetricField(value.id, e.value!))}
          placeholder="Select Metric"
          value={value.field}
        />
      )}

      {isPipelineAggregation(value) && !isPipelineAggregationWithMultipleBucketPaths(value) && (
        <MetricPicker
          className={cx(styles.color)}
          onChange={e => dispatch(changeMetricField(value.id, e.value?.id!))}
          options={previousMetrics}
          value={value.field}
        />
      )}

      {isMetricAggregationWithSettings(value) && <SettingsEditor metric={value} previousMetrics={previousMetrics} />}

      <ToggleVisibilityButton onClick={() => dispatch(toggleMetricVisibility(value.id))} hide={!!value.hide} />
    </QueryEditorRow>
  );
};
