import { escapeRegExp } from 'lodash';
import { PIPE_PARSERS } from './syntax';
import { LokiQuery, LokiQueryType } from './types';

export function formatQuery(selector: string | undefined): string {
  return `${selector || ''}`.trim();
}

/**
 * Returns search terms from a LogQL query.
 * E.g., `{} |= foo |=bar != baz` returns `['foo', 'bar']`.
 */
export function getHighlighterExpressionsFromQuery(input: string): string[] {
  let expression = input;
  const results = [];

  // Consume filter expression from left to right
  while (expression) {
    const filterStart = expression.search(/\|=|\|~|!=|!~/);
    // Nothing more to search
    if (filterStart === -1) {
      break;
    }
    // Drop terms for negative filters
    const filterOperator = expression.substr(filterStart, 2);
    const skip = expression.substr(filterStart).search(/!=|!~/) === 0;
    expression = expression.substr(filterStart + 2);
    if (skip) {
      continue;
    }
    // Check if there is more chained
    const filterEnd = expression.search(/\|=|\|~|!=|!~/);
    let filterTerm;
    if (filterEnd === -1) {
      filterTerm = expression.trim();
    } else {
      filterTerm = expression.substr(0, filterEnd).trim();
      expression = expression.substr(filterEnd);
    }

    const quotedTerm = filterTerm.match(/"(.*?)"/);
    const backtickedTerm = filterTerm.match(/`(.*?)`/);
    const term = quotedTerm || backtickedTerm;

    if (term) {
      const unwrappedFilterTerm = term[1];
      const regexOperator = filterOperator === '|~';

      // Only filter expressions with |~ operator are treated as regular expressions
      if (regexOperator) {
        // When using backticks, Loki doesn't require to escape special characters and we can just push regular expression to highlights array
        // When using quotes, we have extra backslash escaping and we need to replace \\ with \
        results.push(backtickedTerm ? unwrappedFilterTerm : unwrappedFilterTerm.replace(/\\\\/g, '\\'));
      } else {
        // We need to escape this string so it is not matched as regular expression
        results.push(escapeRegExp(unwrappedFilterTerm));
      }
    } else {
      return results;
    }
  }

  return results;
}

export function queryHasPipeParser(expr: string): boolean {
  const parsers = PIPE_PARSERS.map((parser) => `${parser.label}`).join('|');
  const regexp = new RegExp(`\\\|\\\s?(${parsers})`);
  return regexp.test(expr);
}

export function addParsedLabelToQuery(expr: string, key: string, value: string | number, operator: string) {
  return expr + ` | ${key}${operator}"${value.toString()}"`;
}

// we are migrating from `.instant` and `.range` to `.queryType`
// the problem is, some old queries have `.instant` and `.range`,
// and do not have `.queryType`, and we have to support those.
// this function looks at all those properties, and returns
// a new query object that:
// - has `.queryType`
// - does not have `.instant`
// - does not have `.range`
export function getNormalizedLokiQuery(query: LokiQuery): LokiQuery {
  // if queryType exists, it is respected
  if (query.queryType !== undefined) {
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
