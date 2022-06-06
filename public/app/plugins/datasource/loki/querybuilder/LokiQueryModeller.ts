import { LokiAndPromQueryModellerBase } from '../../prometheus/querybuilder/shared/LokiAndPromQueryModellerBase';
import { QueryBuilderLabelFilter } from '../../prometheus/querybuilder/shared/types';

import { getOperationDefinitions } from './operations';
import { LokiOperationId, LokiQueryPattern, LokiVisualQueryOperationCategory } from './types';

export class LokiQueryModeller extends LokiAndPromQueryModellerBase {
  constructor() {
    super(getOperationDefinitions);

    this.setOperationCategories([
      LokiVisualQueryOperationCategory.Aggregations,
      LokiVisualQueryOperationCategory.RangeFunctions,
      LokiVisualQueryOperationCategory.Formats,
      LokiVisualQueryOperationCategory.BinaryOps,
      LokiVisualQueryOperationCategory.LabelFilters,
      LokiVisualQueryOperationCategory.LineFilters,
    ]);
  }

  renderLabels(labels: QueryBuilderLabelFilter[]) {
    if (labels.length === 0) {
      return '{}';
    }

    return super.renderLabels(labels);
  }

  getQueryPatterns(): LokiQueryPattern[] {
    return [
      {
        name: 'Log query with parsing',
        // {} |= `` | logfmt | label="value"
        operations: [
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
        ],
      },
      {
        name: 'Log query with filtering and parsing',
        // {} |= `` | logfmt | __error__=``
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
        ],
      },
      {
        name: 'Log query with parsing and label filter',
        // {} |= `` | logfmt | __error__=''
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.LabelFilter, params: ['', '=', ''] },
        ],
      },
      {
        name: 'Log query with parsing of nested json',
        // {} | json | line_format "{{ .message}}" | json
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.Json, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.LineFormat, params: ['"{{.message}}'] },
          { id: LokiOperationId.Json, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
        ],
      },
      {
        name: 'Log query with updated log line',
        // {} | json | line_format "{{.message}}"
        operations: [
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.LineFormat, params: ['"{{.message}}'] },
        ],
      },
      {
        name: 'Log query with mapped log level',
        // {} | json | label_format level=lvl
        operations: [
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.LabelFormat, params: ['lvl', 'level'] },
        ],
      },
      {
        name: 'Metrics query on value inside log line',
        // sum(sum_over_time({ | logfmt | __error__=`` | unwrap | __error__=`` [$__interval]))
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.Unwrap, params: [''] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.SumOverTime, params: ['$__interval'] },
          { id: LokiOperationId.Sum, params: [] },
        ],
      },
      {
        name: 'Metrics query for total requests per label',
        // sum by() (count_over_time({}[$__interval)
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.CountOverTime, params: ['$__interval'] },
          { id: LokiOperationId.Sum, params: ['label'] },
        ],
      },
      {
        name: 'Metrics query for total requests per parsed label',
        // sum by() (count_over_time({}| json | __error__=`` [$__interval))
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.CountOverTime, params: ['$__interval'] },
          { id: LokiOperationId.Sum, params: [] },
        ],
      },
      {
        name: 'Metrics query for bytes used by log stream',
        // bytes_over_time({}[$__interval])
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.BytesOverTime, params: ['$__interval'] },
        ],
      },
      {
        name: 'Metrics query for count of log lines',
        // count_over_time({}[$__interval])
        operations: [
          { id: LokiOperationId.LineMatchesRegex, params: [''] },
          { id: LokiOperationId.CountOverTime, params: ['$__interval'] },
        ],
      },
      {
        name: 'Metrics query for top n results by parsed label',
        // topk(10, sum by () (count_over_time({} | json | __error__=`` [$__interval])))
        operations: [
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.CountOverTime, params: ['$__interval'] },
          { id: LokiOperationId.Sum, params: [] },
          { id: LokiOperationId.TopK, params: [10] },
        ],
      },
      {
        name: 'Metrics query for extracted quantile',
        // quantile_over_time(0.99,{} | json | unwrap latency[$__interval]) by ()
        operations: [
          { id: LokiOperationId.Logfmt, params: [] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.Unwrap, params: ['latency'] },
          { id: LokiOperationId.LabelFilterNoErrors, params: [] },
          { id: LokiOperationId.QuantileOverTime, params: ['$__interval'] },
          { id: LokiOperationId.Sum, params: [] },
        ],
      },
    ];
  }
}

export const lokiQueryModeller = new LokiQueryModeller();
