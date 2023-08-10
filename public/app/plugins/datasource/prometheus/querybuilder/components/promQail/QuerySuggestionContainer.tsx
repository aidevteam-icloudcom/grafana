import { cx } from '@emotion/css';
import React from 'react';

import { Button, useTheme2 } from '@grafana/ui';

import { getStyles } from './PromQail';
import { QuerySuggestionItem } from './QuerySuggestionItem';
import { QuerySuggestion, SuggestionType } from './types';

export type Props = {
  querySuggestions: QuerySuggestion[];
  suggestionType: SuggestionType;
  closeDrawer: () => void;
  nextInteraction: () => void;
};

export function QuerySuggestionContainer(props: Props) {
  const { suggestionType, querySuggestions, closeDrawer, nextInteraction } = props;

  const theme = useTheme2();
  const styles = getStyles(theme);

  const text = 'Here are 5 query suggestions:';
  let secondaryText, refineText;

  if (suggestionType === SuggestionType.Historical) {
    secondaryText = 'These queries based off of historical data (top used queries) for your metric.';
    refineText = 'I want to write a prompt';
  } else if (suggestionType === SuggestionType.AI) {
    secondaryText =
      'These queries were based off of natural language descriptions of the most commonly used PromQL queries.';
    refineText = 'Refine prompt';
  }

  return (
    <>
      <div className={styles.textPadding}>{text}</div>
      <div className={cx(styles.secondaryText, styles.bottomMargin)}>{secondaryText}</div>
      <div className={styles.infoContainer}>
        {querySuggestions.map((qs: QuerySuggestion, idx: number) => {
          return <QuerySuggestionItem querySuggestion={qs} key={idx} order={idx + 1} />;
        })}
      </div>
      <div>
        <div className={cx(styles.afterButtons, styles.textPadding)}>
          <Button onClick={nextInteraction} fill="outline" variant="secondary" size="sm">
            {refineText}
          </Button>
        </div>
        <div className={cx(styles.textPadding, styles.floatRight)}>
          <Button fill="outline" variant="secondary" size="sm" onClick={closeDrawer}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
