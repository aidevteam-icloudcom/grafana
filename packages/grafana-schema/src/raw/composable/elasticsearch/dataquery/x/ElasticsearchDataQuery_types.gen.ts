// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     TSTypesJenny
//     LatestMajorsOrXJenny
//     PluginEachMajorJenny
//
// Run 'make gen-cue' from repository root to regenerate.

import * as common from '@grafana/schema';

export const pluginVersion = "10.3.5";

export type BucketAggregation = (DateHistogram | Histogram | Terms | Filters | GeoHashGrid | Nested);

export type MetricAggregation = (Count | PipelineMetricAggregation | MetricAggregationWithSettings);

export type BucketAggregationType = ('terms' | 'filters' | 'geohash_grid' | 'date_histogram' | 'histogram' | 'nested');

export interface BaseBucketAggregation {
  id: string;
  settings?: unknown;
  type: BucketAggregationType;
}

export interface BucketAggregationWithField extends BaseBucketAggregation {
  field?: string;
}

export interface DateHistogram extends BucketAggregationWithField {
  settings?: {
    interval?: string;
    min_doc_count?: string;
    trimEdges?: string;
    offset?: string;
    timeZone?: string;
  };
  type: 'date_histogram';
}

export interface DateHistogramSettings {
  interval?: string;
  min_doc_count?: string;
  offset?: string;
  timeZone?: string;
  trimEdges?: string;
}

export interface Histogram extends BucketAggregationWithField {
  settings?: {
    interval?: string;
    min_doc_count?: string;
  };
  type: 'histogram';
}

export interface HistogramSettings {
  interval?: string;
  min_doc_count?: string;
}

export type TermsOrder = ('desc' | 'asc');

export interface Nested extends BucketAggregationWithField {
  settings?: Record<string, unknown>;
  type: 'nested';
}

export interface Terms extends BucketAggregationWithField {
  settings?: {
    order?: TermsOrder;
    size?: string;
    min_doc_count?: string;
    orderBy?: string;
    missing?: string;
  };
  type: 'terms';
}

export interface TermsSettings {
  min_doc_count?: string;
  missing?: string;
  order?: TermsOrder;
  orderBy?: string;
  size?: string;
}

export interface Filters extends BaseBucketAggregation {
  settings?: {
    filters?: Array<Filter>;
  };
  type: 'filters';
}

export type Filter = {
  query: string,
  label: string,
};

export interface FiltersSettings {
  filters?: Array<Filter>;
}

export const defaultFiltersSettings: Partial<FiltersSettings> = {
  filters: [],
};

export interface GeoHashGrid extends BucketAggregationWithField {
  settings?: {
    precision?: string;
  };
  type: 'geohash_grid';
}

export interface GeoHashGridSettings {
  precision?: string;
}

export type PipelineMetricAggregationType = ('moving_avg' | 'moving_fn' | 'derivative' | 'serial_diff' | 'cumulative_sum' | 'bucket_script');

export type MetricAggregationType = ('count' | 'avg' | 'sum' | 'min' | 'max' | 'extended_stats' | 'percentiles' | 'cardinality' | 'raw_document' | 'raw_data' | 'logs' | 'rate' | 'top_metrics' | PipelineMetricAggregationType);

export interface BaseMetricAggregation {
  hide?: boolean;
  id: string;
  type: MetricAggregationType;
}

export interface PipelineVariable {
  name: string;
  pipelineAgg: string;
}

export interface MetricAggregationWithField extends BaseMetricAggregation {
  field?: string;
}

export interface MetricAggregationWithMissingSupport extends BaseMetricAggregation {
  settings?: {
    missing?: string;
  };
}

export type InlineScript = (string | {
    inline?: string
  });

export interface MetricAggregationWithInlineScript extends BaseMetricAggregation {
  settings?: {
    script?: InlineScript;
  };
}

export interface Count extends BaseMetricAggregation {
  type: 'count';
}

export interface Average extends MetricAggregationWithField, MetricAggregationWithMissingSupport, MetricAggregationWithInlineScript {
  field?: string;
  settings?: {
    script?: InlineScript;
    missing?: string;
  };
  type: 'avg';
}

export interface Sum extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  field?: string;
  settings?: {
    script?: InlineScript;
    missing?: string;
  };
  type: 'sum';
}

export interface Max extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  field?: string;
  settings?: {
    script?: InlineScript;
    missing?: string;
  };
  type: 'max';
}

export interface Min extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  field?: string;
  settings?: {
    script?: InlineScript;
    missing?: string;
  };
  type: 'min';
}

export type ExtendedStatMetaType = ('avg' | 'min' | 'max' | 'sum' | 'count' | 'std_deviation' | 'std_deviation_bounds_upper' | 'std_deviation_bounds_lower');

export interface ExtendedStat {
  label: string;
  value: ExtendedStatMetaType;
}

export interface ExtendedStats extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  field?: string;
  meta?: Record<string, unknown>;
  settings?: {
    script?: InlineScript;
    missing?: string;
    sigma?: string;
  };
  type: 'extended_stats';
}

export interface Percentiles extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  field?: string;
  settings?: {
    script?: InlineScript;
    missing?: string;
    percents?: Array<string>;
  };
  type: 'percentiles';
}

export interface UniqueCount extends MetricAggregationWithField {
  settings?: {
    precision_threshold?: string;
    missing?: string;
  };
  type: 'cardinality';
}

export interface RawDocument extends BaseMetricAggregation {
  settings?: {
    size?: string;
  };
  type: 'raw_document';
}

export interface RawData extends BaseMetricAggregation {
  settings?: {
    size?: string;
  };
  type: 'raw_data';
}

export interface Logs extends BaseMetricAggregation {
  settings?: {
    limit?: string;
  };
  type: 'logs';
}

export interface Rate extends MetricAggregationWithField {
  settings?: {
    unit?: string;
    mode?: string;
  };
  type: 'rate';
}

export interface BasePipelineMetricAggregation extends MetricAggregationWithField {
  pipelineAgg?: string;
  type: PipelineMetricAggregationType;
}

export interface PipelineMetricAggregationWithMultipleBucketPaths extends BaseMetricAggregation {
  pipelineVariables?: Array<PipelineVariable>;
}

export const defaultPipelineMetricAggregationWithMultipleBucketPaths: Partial<PipelineMetricAggregationWithMultipleBucketPaths> = {
  pipelineVariables: [],
};

export type MovingAverageModel = ('simple' | 'linear' | 'ewma' | 'holt' | 'holt_winters');

export interface MovingAverageModelOption {
  label: string;
  value: MovingAverageModel;
}

export interface BaseMovingAverageModelSettings {
  model: MovingAverageModel;
  predict: string;
  window: string;
}

export interface MovingAverageSimpleModelSettings extends BaseMovingAverageModelSettings {
  model: 'simple';
}

export interface MovingAverageLinearModelSettings extends BaseMovingAverageModelSettings {
  model: 'linear';
}

export interface MovingAverageEWMAModelSettings extends BaseMovingAverageModelSettings {
  minimize: boolean;
  model: 'ewma';
  settings?: {
    alpha?: string;
  };
}

export interface MovingAverageHoltModelSettings extends BaseMovingAverageModelSettings {
  minimize: boolean;
  model: 'holt';
  settings: {
    alpha?: string;
    beta?: string;
  };
}

export interface MovingAverageHoltWintersModelSettings extends BaseMovingAverageModelSettings {
  minimize: boolean;
  model: 'holt_winters';
  settings: {
    alpha?: string;
    beta?: string;
    gamma?: string;
    period?: string;
    pad?: boolean;
  };
}

/**
 * #MovingAverage's settings are overridden in types.ts
 */
export interface MovingAverage extends BasePipelineMetricAggregation {
  settings?: Record<string, unknown>;
  type: 'moving_avg';
}

export interface MovingFunction extends BasePipelineMetricAggregation {
  settings?: {
    window?: string;
    script?: InlineScript;
    shift?: string;
  };
  type: 'moving_fn';
}

export interface Derivative extends BasePipelineMetricAggregation {
  settings?: {
    unit?: string;
  };
  type: 'derivative';
}

export interface SerialDiff extends BasePipelineMetricAggregation {
  settings?: {
    lag?: string;
  };
  type: 'serial_diff';
}

export interface CumulativeSum extends BasePipelineMetricAggregation {
  settings?: {
    format?: string;
  };
  type: 'cumulative_sum';
}

export interface BucketScript extends PipelineMetricAggregationWithMultipleBucketPaths {
  settings?: {
    script?: InlineScript;
  };
  type: 'bucket_script';
}

export interface TopMetrics extends BaseMetricAggregation {
  settings?: {
    order?: string;
    orderBy?: string;
    metrics?: Array<string>;
  };
  type: 'top_metrics';
}

export type PipelineMetricAggregation = (MovingAverage | Derivative | CumulativeSum | BucketScript);

export type MetricAggregationWithSettings = (BucketScript | CumulativeSum | Derivative | SerialDiff | RawData | RawDocument | UniqueCount | Percentiles | ExtendedStats | Min | Max | Sum | Average | MovingAverage | MovingFunction | Logs | Rate | TopMetrics);

export interface ElasticsearchDataQuery extends common.DataQuery {
  /**
   * Alias pattern
   */
  alias?: string;
  /**
   * List of bucket aggregations
   */
  bucketAggs?: Array<BucketAggregation>;
  /**
   * List of metric aggregations
   */
  metrics?: Array<MetricAggregation>;
  /**
   * Lucene query
   */
  query?: string;
  /**
   * Name of time field
   */
  timeField?: string;
}

export const defaultElasticsearchDataQuery: Partial<ElasticsearchDataQuery> = {
  bucketAggs: [],
  metrics: [],
};
