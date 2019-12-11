import React, { FunctionComponent } from 'react';
import { css, cx } from 'emotion';
import { Labels } from '@grafana/data';

import { stylesFactory } from '../../themes';
import { Themeable } from '../../types/theme';
import { GrafanaTheme } from '@grafana/data';
import { selectThemeVariant } from '../../themes/selectThemeVariant';
import { withTheme } from '../../themes/ThemeContext';

const HIDDEN_LABELS = ['level', 'lvl', 'filename'];

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    logsLabels: css`
      display: flex;
      flex-wrap: wrap;
      font-size: ${theme.typography.size.xs};
    `,
    logsLabel: css`
      label: logs-label;
      display: flex;
      padding: 0 2px;
      background-color: ${selectThemeVariant({ light: theme.colors.gray5, dark: theme.colors.dark6 }, theme.type)};
      border-radius: ${theme.border.radius};
      margin: 0 4px 2px 0;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    `,
    logsLabelValue: css`
      label: logs-label__value;
      display: inline-block;
      max-width: 20em;
      text-overflow: ellipsis;
      overflow: hidden;
    `,
  };
});

interface Props extends Themeable {
  labels: Labels;
}

export const UnThemedLogLabels: FunctionComponent<Props> = ({ labels, theme }) => {
  const styles = getStyles(theme);
  const displayLabels = Object.keys(labels).filter(label => !label.startsWith('_') && !HIDDEN_LABELS.includes(label));

  if (displayLabels.length === 0) {
    return <span className={cx([styles.logsLabel])}>(no unique labels)</span>;
  }

  return (
    <span className={cx([styles.logsLabels])}>
      {displayLabels.map(label => {
        const value = labels[label];
        const tooltip = `${label}: ${value}`;
        return (
          <span key={label} className={cx([styles.logsLabel])}>
            <span className={cx([styles.logsLabelValue])} title={tooltip}>
              {value}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export const LogLabels = withTheme(UnThemedLogLabels);
LogLabels.displayName = 'LogLabels';
