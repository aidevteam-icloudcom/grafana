import escapeRegExp from 'lodash/escapeRegExp';

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

    // Unwrap the filter term by removing quotes. In logQL we can use quotes and backticks so we are checking for both.
    const quotedTerm = filterTerm.match(/"(.*?)"/);
    const backslashTerm = filterTerm.match(/`(.*?)`/);
    const term = quotedTerm || backslashTerm;

    if (term) {
      const unwrappedFilterTerm = term[1];
      const regexOperator = filterOperator === '|~';
      results.push(
        regexOperator
          ? quotedTerm
            ? unwrappedFilterTerm.replace('\\\\', '\\')
            : unwrappedFilterTerm
          : unwrappedFilterTerm
      );
    } else {
      return [];
    }
  }

  return results;
}
