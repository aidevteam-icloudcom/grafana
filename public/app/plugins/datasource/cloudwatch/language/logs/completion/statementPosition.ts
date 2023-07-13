import { LinkedToken } from '../../monarch/LinkedToken';
import { StatementPosition } from '../../monarch/types';
import {
  DISPLAY,
  FIELDS,
  FILTER,
  STATS,
  SORT,
  LIMIT,
  PARSE,
  DEDUP,
  LOGS_COMMANDS,
  LOGS_FUNCTION_OPERATORS,
  LOGS_LOGIC_OPERATORS,
} from '../language';

import { LogsTokenTypes } from './types';

const d = (...args: Array<string | LinkedToken | null | undefined>) => console.log('getStatementPosition:', ...args);

export const getStatementPosition = (currentToken: LinkedToken | null): StatementPosition => {
  const previousNonWhiteSpace = currentToken?.getPreviousNonWhiteSpaceToken();
  const nextNonWhiteSpace = currentToken?.getNextNonWhiteSpaceToken();

  d('currentToken:', currentToken);
  d('previousNonWhiteSpace:', previousNonWhiteSpace);
  d('nextNonWhiteSpace:', nextNonWhiteSpace);

  const normalizedCurrentToken = currentToken?.value?.toLowerCase();
  const normalizedPreviousNonWhiteSpace = previousNonWhiteSpace?.value?.toLowerCase();

  if (currentToken?.is(LogsTokenTypes.Comment)) {
    d('StatementPosition.Comment');
    return StatementPosition.Comment;
  }

  if (currentToken?.isFunction()) {
    d('StatementPosition.Function');
    return StatementPosition.Function;
  }

  if (
    currentToken === null ||
    (currentToken?.isWhiteSpace() && previousNonWhiteSpace === null && nextNonWhiteSpace === null) ||
    (previousNonWhiteSpace?.is(LogsTokenTypes.Delimiter, '|') && currentToken?.isWhiteSpace()) ||
    (currentToken?.isIdentifier() &&
      (previousNonWhiteSpace?.is(LogsTokenTypes.Delimiter, '|') || previousNonWhiteSpace === null))
  ) {
    d('StatementPosition.NewCommand');
    return StatementPosition.NewCommand;
  }

  if (
    currentToken?.is(LogsTokenTypes.Delimiter, ')') ||
    (currentToken?.isWhiteSpace() && previousNonWhiteSpace?.is(LogsTokenTypes.Delimiter, ')'))
  ) {
    const openingParenthesis = currentToken?.getPreviousOfType(LogsTokenTypes.Delimiter, '(');
    const normalizedNonWhitespacePreceedingOpeningParenthesis = openingParenthesis
      ?.getPreviousNonWhiteSpaceToken()
      ?.value?.toLowerCase();

    if (normalizedNonWhitespacePreceedingOpeningParenthesis) {
      if (LOGS_COMMANDS.includes(normalizedNonWhitespacePreceedingOpeningParenthesis)) {
        d('StatementPosition.AfterCommand');
        return StatementPosition.AfterCommand;
      }
      if (LOGS_FUNCTION_OPERATORS.includes(normalizedNonWhitespacePreceedingOpeningParenthesis)) {
        d('StatementPosition.AfterFunction');
        return StatementPosition.AfterFunction;
      }
    }
  }

  if (currentToken?.isKeyword() && normalizedCurrentToken) {
    switch (normalizedCurrentToken) {
      case DEDUP:
        d('StatementPosition.DedupKeyword');
        return StatementPosition.DedupKeyword;
      case DISPLAY:
        d('StatementPosition.DisplayKeyword');
        return StatementPosition.DisplayKeyword;
      case FIELDS:
        d('StatementPosition.FieldsKeyword');
        return StatementPosition.FieldsKeyword;
      case FILTER:
        d('StatementPosition.FilterKeyword');
        return StatementPosition.FilterKeyword;
      case LIMIT:
        d('StatementPosition.LimitKeyword');
        return StatementPosition.LimitKeyword;
      case PARSE:
        d('StatementPosition.ParseKeyword');
        return StatementPosition.ParseKeyword;
      case STATS:
        d('StatementPosition.StatsKeyword');
        return StatementPosition.StatsKeyword;
      case SORT:
        d('StatementPosition.SortKeyword');
        return StatementPosition.SortKeyword;
      case 'as':
        d('StatementPosition.AsKeyword');
        return StatementPosition.AsKeyword;
      case 'by':
        d('StatementPosition.ByKeyword');
        return StatementPosition.ByKeyword;
      case 'in':
        d('StatementPosition.InKeyword');
        return StatementPosition.InKeyword;
      case 'like':
        d('StatementPosition.LikeKeyword');
        return StatementPosition.LikeKeyword;
    }
  }

  if (currentToken?.isWhiteSpace() && previousNonWhiteSpace?.isKeyword && normalizedPreviousNonWhiteSpace) {
    switch (normalizedPreviousNonWhiteSpace) {
      case DEDUP:
        d('StatementPosition.AfterDedupKeyword');
        return StatementPosition.AfterDedupKeyword;
      case DISPLAY:
        d('StatementPosition.AfterDisplayKeyword');
        return StatementPosition.AfterDisplayKeyword;
      case FIELDS:
        d('StatementPosition.AfterFieldsKeyword');
        return StatementPosition.AfterFieldsKeyword;
      case FILTER:
        d('StatementPosition.AfterFilterKeyword');
        return StatementPosition.AfterFilterKeyword;
      case LIMIT:
        d('StatementPosition.AfterLimitKeyword');
        return StatementPosition.AfterLimitKeyword;
      case PARSE:
        d('StatementPosition.AfterParseKeyword');
        return StatementPosition.AfterParseKeyword;
      case STATS:
        d('StatementPosition.AfterStatsKeyword');
        return StatementPosition.AfterStatsKeyword;
      case SORT:
        d('StatementPosition.AfterSortKeyword');
        return StatementPosition.AfterSortKeyword;
      case 'as':
        d('StatementPosition.AfterAsKeyword');
        return StatementPosition.AfterAsKeyword;
      case 'by':
        d('StatementPosition.AfterByKeyword');
        return StatementPosition.AfterByKeyword;
      case 'in':
        d('StatementPosition.AfterInKeyword');
        return StatementPosition.AfterInKeyword;
      case 'like':
        d('StatementPosition.AfterLikeKeyword');
        return StatementPosition.AfterLikeKeyword;
    }
  }

  if (currentToken?.is(LogsTokenTypes.Operator) && normalizedCurrentToken) {
    if (['+', '-', '*', '/', '^', '%'].includes(normalizedCurrentToken)) {
      d('StatementPosition.ArithmeticOperator');
      return StatementPosition.ArithmeticOperator;
    }

    if (['=', '!=', '<', '>', '<=', '>='].includes(normalizedCurrentToken)) {
      d('StatementPosition.ComparisonOperator');
      return StatementPosition.ComparisonOperator;
    }

    if (LOGS_LOGIC_OPERATORS.includes(normalizedCurrentToken)) {
      d('StatementPosition.BooleanOperator');
      return StatementPosition.BooleanOperator;
    }
  }

  if (previousNonWhiteSpace?.is(LogsTokenTypes.Operator) && normalizedPreviousNonWhiteSpace) {
    if (['+', '-', '*', '/', '^', '%'].includes(normalizedPreviousNonWhiteSpace)) {
      d('StatementPosition.ArithmeticOperatorArg');
      return StatementPosition.ArithmeticOperatorArg;
    }

    if (['=', '!=', '<', '>', '<=', '>='].includes(normalizedPreviousNonWhiteSpace)) {
      d('StatementPosition.ComparisonOperatorArg');
      return StatementPosition.ComparisonOperatorArg;
    }

    if (LOGS_LOGIC_OPERATORS.includes(normalizedPreviousNonWhiteSpace)) {
      d('StatementPosition.BooleanOperatorArg');
      return StatementPosition.BooleanOperatorArg;
    }
  }

  if (
    currentToken?.isIdentifier() ||
    currentToken?.isNumber() ||
    currentToken?.is(LogsTokenTypes.Parenthesis, '()') ||
    currentToken?.is(LogsTokenTypes.Delimiter, ',') ||
    currentToken?.is(LogsTokenTypes.Parenthesis, ')') ||
    (currentToken?.isWhiteSpace() && previousNonWhiteSpace?.is(LogsTokenTypes.Delimiter, ',')) ||
    (currentToken?.isWhiteSpace() && previousNonWhiteSpace?.isIdentifier()) ||
    (currentToken?.isWhiteSpace() &&
      previousNonWhiteSpace?.isKeyword() &&
      normalizedPreviousNonWhiteSpace &&
      LOGS_COMMANDS.includes(normalizedPreviousNonWhiteSpace))
  ) {
    const nearestKeyword = currentToken?.getPreviousOfType(LogsTokenTypes.Keyword);
    const nearestFunction = currentToken?.getPreviousOfType(LogsTokenTypes.Function);

    if (nearestKeyword !== null && nearestFunction === null) {
      if (nearestKeyword.value === SORT) {
        d('StatementPosition.SortArg');
        return StatementPosition.SortArg;
      }
      if (nearestKeyword.value === FILTER) {
        d('StatementPosition.FilterArg');
        return StatementPosition.FilterArg;
      }
      d('StatementPosition.CommandArg');
      return StatementPosition.CommandArg;
    }

    if (nearestFunction !== null && nearestKeyword === null) {
      d('StatementPosition.FunctionArg');
      return StatementPosition.FunctionArg;
    }

    if (nearestKeyword !== null && nearestFunction !== null) {
      if (
        nearestKeyword.range.startLineNumber > nearestFunction.range.startLineNumber ||
        nearestKeyword.range.endColumn > nearestFunction.range.endColumn
      ) {
        if (nearestKeyword.value === SORT) {
          d('StatementPosition.SortArg');
          return StatementPosition.SortArg;
        }
        if (nearestKeyword.value === FILTER) {
          d('StatementPosition.FilterArg');
          return StatementPosition.FilterArg;
        }
        d('StatementPosition.CommandArg');
        return StatementPosition.CommandArg;
      }

      if (
        nearestFunction.range.startLineNumber > nearestKeyword.range.startLineNumber ||
        nearestFunction.range.endColumn > nearestKeyword.range.endColumn
      ) {
        d('StatementPosition.FunctionArg');
        return StatementPosition.FunctionArg;
      }
    }
  }

  d('StatementPosition.Unknown');
  return StatementPosition.Unknown;
};
