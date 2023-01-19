// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     TSTypesJenny
//     PluginTSTypesJenny
//
// Run 'make gen-cue' from repository root to regenerate.

import * as common from '@grafana/schema';

export const DataQueryModelVersion = Object.freeze([0, 0]);

/**
 * #CloudWatchMetricsQuery | #CloudWatchLogsQuery
 */
export interface CloudWatchMetricsQuery {
  alias?: string;
  /**
   * Math expression query
   */
  expression?: string;
  /**
   * common props
   */
  id: string;
  label?: string;
  metricEditorMode?: MetricEditorMode;
  metricQueryType?: MetricQueryType;
  queryMode?: CloudWatchQueryMode;
  sql?: SQLExpression;
  sqlExpression?: string;
}

export enum CloudWatchQueryMode {
  Annotations = 'Annotations',
  Logs = 'Logs',
  Metrics = 'Metrics',
}

export enum MetricQueryType {
  Query = 1,
  Search = 0,
}

export enum MetricEditorMode {
  Builder = 0,
  Code = 1,
}

export interface SQLExpression {
  from?: (QueryEditorPropertyExpression | QueryEditorFunctionExpression);
  groupBy?: QueryEditorArrayExpression;
  limit?: number;
  orderBy?: QueryEditorFunctionExpression;
  orderByDirection?: string;
  select?: QueryEditorFunctionExpression;
  where?: QueryEditorArrayExpression;
}

export interface QueryEditorFunctionExpression {
  name?: string;
  parameters?: Array<QueryEditorFunctionParameterExpression>;
  type: QueryEditorExpressionType.Function;
}

export const defaultQueryEditorFunctionExpression: Partial<QueryEditorFunctionExpression> = {
  parameters: [],
};

export enum QueryEditorExpressionType {
  And = 'and',
  Function = 'function',
  FunctionParameter = 'functionParameter',
  GroupBy = 'groupBy',
  Operator = 'operator',
  Or = 'or',
  Property = 'property',
}

export interface QueryEditorFunctionParameterExpression {
  name?: string;
  type: QueryEditorExpressionType.FunctionParameter;
}

export interface QueryEditorPropertyExpression {
  property: QueryEditorProperty;
  type: QueryEditorExpressionType.Property;
}

export interface QueryEditorGroupByExpression {
  property: QueryEditorProperty;
  type: QueryEditorExpressionType.GroupBy;
}

export interface QueryEditorOperatorExpression {
  operator: {
    name?: string;
    value?: (QueryEditorOperatorType | Array<QueryEditorOperatorType>);
  };
  property: QueryEditorProperty;
  type: QueryEditorExpressionType.Operator;
}

export type QueryEditorOperatorType = (string | boolean | number);

export interface QueryEditorProperty {
  name?: string;
  type: QueryEditorPropertyType;
}

export enum QueryEditorPropertyType {
  String = 'string',
  Test = 'test',
}

export interface QueryEditorArrayExpression {
  expressions: unknown;
  type: QueryEditorExpressionType;
}

export interface CloudWatchLogsQuery {
  expression?: string;
  id: string;
  /**
   * deprecated, use logGroups instead
   */
  logGroupNames?: Array<string>;
  logGroups?: Array<LogGroup>;
  queryMode: CloudWatchQueryMode;
  region: string;
  statsGroups?: Array<string>;
}

export const defaultCloudWatchLogsQuery: Partial<CloudWatchLogsQuery> = {
  logGroupNames: [],
  logGroups: [],
  statsGroups: [],
};

export interface LogGroup {
  accountId?: string;
  accountLabel?: string;
  arn: string;
  name: string;
}

export interface CloudWatch extends common.DataQuery {}
