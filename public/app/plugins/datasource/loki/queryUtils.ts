import { SyntaxNode } from '@lezer/common';
import { escapeRegExp } from 'lodash';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  dateTime,
  DurationUnit,
  TimeRange,
} from '@grafana/data';
import {
  parser,
  LineFilter,
  PipeExact,
  PipeMatch,
  Filter,
  String,
  LabelFormatExpr,
  Selector,
  PipelineExpr,
  LabelParser,
  JsonExpressionParser,
  LabelFilter,
  MetricExpr,
  Matcher,
  Identifier,
  Rate,
} from '@grafana/lezer-logql';

import { ErrorId } from '../prometheus/querybuilder/shared/parsingUtils';

import { getStreamSelectorPositions } from './modifyQuery';
import { LokiQuery, LokiQueryType } from './types';

export function formatQuery(selector: string | undefined): string {
  return `${selector || ''}`.trim();
}

/**
 * Returns search terms from a LogQL query.
 * E.g., `{} |= foo |=bar != baz` returns `['foo', 'bar']`.
 */
export function getHighlighterExpressionsFromQuery(input: string): string[] {
  const results = [];

  const tree = parser.parse(input);
  const filters: SyntaxNode[] = [];
  tree.iterate({
    enter: ({ type, node }): void => {
      if (type.id === LineFilter) {
        filters.push(node);
      }
    },
  });

  for (let filter of filters) {
    const pipeExact = filter.getChild(Filter)?.getChild(PipeExact);
    const pipeMatch = filter.getChild(Filter)?.getChild(PipeMatch);
    const string = filter.getChild(String);

    if ((!pipeExact && !pipeMatch) || !string) {
      continue;
    }

    const filterTerm = input.substring(string.from, string.to).trim();
    const backtickedTerm = filterTerm[0] === '`';
    const unwrappedFilterTerm = filterTerm.substring(1, filterTerm.length - 1);

    if (!unwrappedFilterTerm) {
      continue;
    }

    let resultTerm = '';

    // Only filter expressions with |~ operator are treated as regular expressions
    if (pipeMatch) {
      // When using backticks, Loki doesn't require to escape special characters and we can just push regular expression to highlights array
      // When using quotes, we have extra backslash escaping and we need to replace \\ with \
      resultTerm = backtickedTerm ? unwrappedFilterTerm : unwrappedFilterTerm.replace(/\\\\/g, '\\');
    } else {
      // We need to escape this string so it is not matched as regular expression
      resultTerm = escapeRegExp(unwrappedFilterTerm);
    }

    if (resultTerm) {
      results.push(resultTerm);
    }
  }
  return results;
}

// we are migrating from `.instant` and `.range` to `.queryType`
// this function returns a new query object that:
// - has `.queryType`
// - does not have `.instant`
// - does not have `.range`
export function getNormalizedLokiQuery(query: LokiQuery): LokiQuery {
  //  if queryType field contains invalid data we behave as if the queryType is empty
  const { queryType } = query;
  const hasValidQueryType =
    queryType === LokiQueryType.Range || queryType === LokiQueryType.Instant || queryType === LokiQueryType.Stream;

  // if queryType exists, it is respected
  if (hasValidQueryType) {
    const { instant, range, ...rest } = query;
    return rest;
  }

  // if no queryType, and instant===true, it's instant
  if (query.instant === true) {
    const { instant, range, ...rest } = query;
    return { ...rest, queryType: LokiQueryType.Instant };
  }

  // otherwise it is range
  const { instant, range, ...rest } = query;
  return { ...rest, queryType: LokiQueryType.Range };
}

const tagsToObscure = ['String', 'Identifier', 'LineComment', 'Number'];
const partsToKeep = ['__error__', '__interval', '__interval_ms'];
export function obfuscate(query: string): string {
  let obfuscatedQuery: string = query;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ name, from, to }): false | void => {
      const queryPart = query.substring(from, to);
      if (tagsToObscure.includes(name) && !partsToKeep.includes(queryPart)) {
        obfuscatedQuery = obfuscatedQuery.replace(queryPart, name);
      }
    },
  });
  return obfuscatedQuery;
}

export function parseToNodeNamesArray(query: string): string[] {
  const queryParts: string[] = [];
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ name }): false | void => {
      queryParts.push(name);
    },
  });
  return queryParts;
}

export function isValidQuery(query: string): boolean {
  let isValid = true;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === ErrorId) {
        isValid = false;
      }
    },
  });
  return isValid;
}

export function isLogsQuery(query: string): boolean {
  let isLogsQuery = true;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === MetricExpr) {
        isLogsQuery = false;
      }
    },
  });
  return isLogsQuery;
}

export function isQueryWithParser(query: string): { queryWithParser: boolean; parserCount: number } {
  let parserCount = 0;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === LabelParser || type.id === JsonExpressionParser) {
        parserCount++;
      }
    },
  });
  return { queryWithParser: parserCount > 0, parserCount };
}

export function getParserFromQuery(query: string) {
  const tree = parser.parse(query);
  let logParser;
  tree.iterate({
    enter: (node: SyntaxNode): false | void => {
      if (node.type.id === LabelParser || node.type.id === JsonExpressionParser) {
        logParser = query.substring(node.from, node.to).trim();
        return false;
      }
    },
  });

  return logParser;
}

export function isQueryPipelineErrorFiltering(query: string): boolean {
  let isQueryPipelineErrorFiltering = false;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type, node }): false | void => {
      if (type.id === LabelFilter) {
        const label = node.getChild(Matcher)?.getChild(Identifier);
        if (label) {
          const labelName = query.substring(label.from, label.to);
          if (labelName === '__error__') {
            isQueryPipelineErrorFiltering = true;
          }
        }
      }
    },
  });

  return isQueryPipelineErrorFiltering;
}

export function isQueryWithLabelFormat(query: string): boolean {
  let queryWithLabelFormat = false;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === LabelFormatExpr) {
        queryWithLabelFormat = true;
      }
    },
  });
  return queryWithLabelFormat;
}

export function getLogQueryFromMetricsQuery(query: string): string {
  if (isLogsQuery(query)) {
    return query;
  }

  const tree = parser.parse(query);

  // Log query in metrics query composes of Selector & PipelineExpr
  let selector = '';
  tree.iterate({
    enter: ({ type, from, to }): false | void => {
      if (type.id === Selector) {
        selector = query.substring(from, to);
        return false;
      }
    },
  });

  let pipelineExpr = '';
  tree.iterate({
    enter: ({ type, from, to }): false | void => {
      if (type.id === PipelineExpr) {
        pipelineExpr = query.substring(from, to);
        return false;
      }
    },
  });

  return selector + pipelineExpr;
}

export function isQueryWithLabelFilter(query: string): boolean {
  const tree = parser.parse(query);
  let hasLabelFilter = false;

  tree.iterate({
    enter: ({ type, node }): false | void => {
      if (type.id === LabelFilter) {
        hasLabelFilter = true;
        return;
      }
    },
  });

  return hasLabelFilter;
}

export function isQueryWithLineFilter(query: string): boolean {
  const tree = parser.parse(query);
  let queryWithLineFilter = false;

  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === LineFilter) {
        queryWithLineFilter = true;
        return;
      }
    },
  });

  return queryWithLineFilter;
}

export function isRateQuery(query: string): boolean {
  let isRateQuery = false;
  const tree = parser.parse(query);
  tree.iterate({
    enter: ({ type }): false | void => {
      if (type.id === Rate) {
        isRateQuery = true;
        return;
      }
    },
  });
  return isRateQuery;
}

export function getStreamSelectorsFromQuery(query: string): string[] {
  const labelMatcherPositions = getStreamSelectorPositions(query);

  const labelMatchers = labelMatcherPositions.map((labelMatcher) => {
    return query.slice(labelMatcher.from, labelMatcher.to);
  });

  return labelMatchers;
}

const PARTITION_LIMIT = 60;
export function partitionTimeRange(range: TimeRange, timeShift = 1, unit: DurationUnit = 'm'): TimeRange[] {
  const partition: TimeRange[] = [];
  for (let from = dateTime(range.from), to = dateTime(from).add(timeShift, unit); to <= range.to && from < range.to; ) {
    partition.push({
      from,
      to,
      raw: { from, to },
    });

    /**
     * The user can request for any arbitrary time range. If we receive one from too
     * long ago, this will cause an extremely large loop which could break the app.
     * Additionally, data retention is limited, so ranges that go above PARTIION_LIMIT
     * will be ignored.
     */
    if (partition.length > PARTITION_LIMIT) {
      return [range];
    }

    from = dateTime(to);
    to = dateTime(to).add(timeShift, unit);

    if (to > range.to) {
      to = range.to;
    }
  }

  return partition;
}

export function requestSupportsPartitioning(queries: LokiQuery[]) {
  /*
   * For now, we would not split when more than 1 query is requested.
   */
  if (queries.length > 1) {
    return false;
  }

  if (isLogsQuery(queries[0].expr)) {
    return false;
  }

  if (isRateQuery(queries[0].expr)) {
    return false;
  }

  return true;
}

export function combineResponses(currentResult: DataQueryResponse | null, newResult: DataQueryResponse) {
  if (!currentResult) {
    return newResult;
  }

  newResult.data.forEach((newFrame) => {
    const currentFrame = currentResult.data.find((frame) => frame.name === newFrame.name);
    if (!currentFrame) {
      currentResult.data.push(newFrame);
      return;
    }
    combineFrames(currentFrame, newFrame);
  });

  return currentResult;
}

function combineFrames(dest: DataQueryResponseData, source: DataQueryResponseData) {
  dest.fields[0].values.reverse();
  dest.fields[1].values.reverse();

  for (let j = source.fields[0].values.length - 1; j >= 0; j--) {
    dest.fields[0].values.add(source.fields[0].values.get(j));
    dest.fields[1].values.add(source.fields[1].values.get(j));
  }

  dest.fields[0].values.reverse();
  dest.fields[1].values.reverse();
}

/**
 * Checks if the current response has reached the requested amount of results or not.
 * For log queries, we will ensure that the current amount of results doesn't go beyond `maxLines`.
 */
export function resultLimitReached(request: DataQueryRequest<LokiQuery>, result: DataQueryResponse) {
  const logRequests = request.targets.filter((target) => isLogsQuery(target.expr));

  if (logRequests.length === 0) {
    return false;
  }

  for (const request of logRequests) {
    for (const frame of result.data) {
      if (request.maxLines && frame?.fields[0].values.length >= request.maxLines) {
        return true;
      }
    }
  }

  return false;
}
