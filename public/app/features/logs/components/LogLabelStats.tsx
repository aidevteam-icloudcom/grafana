import { css } from '@emotion/css';
import React, { PureComponent } from 'react';

import { LogLabelStatsModel, GrafanaTheme2 } from '@grafana/data';
import { stylesFactory, withTheme2, Themeable2 } from '@grafana/ui';

//Components
import { LogLabelStatsRow } from './LogLabelStatsRow';

const STATS_ROW_LIMIT = 5;

const getStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    logsStats: css`
      label: logs-stats;
      background: inherit;
      color: ${theme.colors.text.primary};
      word-break: break-all;
      width: fit-content;
      max-width: 100%;
      margin: ${theme.spacing(2)} 0;
    `,
    logsStatsHeader: css`
      label: logs-stats__header;
      border-bottom: 1px solid ${theme.colors.border.medium};
      display: flex;
    `,
    logsStatsTitle: css`
      label: logs-stats__title;
      font-weight: ${theme.typography.fontWeightMedium};
      padding-right: ${theme.spacing(2)};
      display: inline-block;
      white-space: nowrap;
      text-overflow: ellipsis;
      flex-grow: 1;
    `,
    logsStatsClose: css`
      label: logs-stats__close;
      cursor: pointer;
    `,
    logsStatsBody: css`
      label: logs-stats__body;
      padding: 5px 0px;
    `,
  };
});

interface Props extends Themeable2 {
  stats: LogLabelStatsModel[];
  label: string;
  value: string;
  rowCount: number;
  isLabel?: boolean;
}

class UnThemedLogLabelStats extends PureComponent<Props> {
  render() {
    const { label, rowCount, stats, value, theme, isLabel } = this.props;
    const style = getStyles(theme);
    const topRows = stats.slice(0, STATS_ROW_LIMIT);
    let activeRow = undefined;
    let otherRows = stats.slice(STATS_ROW_LIMIT);
    const insertActiveRow = !activeRow;

    // Remove active row from other to show extra
    if (insertActiveRow) {
      activeRow = otherRows.find((row) => row.value === value);
      otherRows = otherRows.filter((row) => row.value !== value);
    }

    const otherCount = otherRows.reduce((sum, row) => sum + row.count, 0);
    const topCount = topRows.reduce((sum, row) => sum + row.count, 0);
    const total = topCount + otherCount;
    const otherProportion = otherCount / total;

    return (
      <div className={style.logsStats} data-testid="logLabelStats">
        <div className={style.logsStatsTitle}>{label}</div>
        <div className={style.logsStatsBody}>
          {topRows.map((stat) => (
            <LogLabelStatsRow key={stat.value} {...stat} active={false} total={total} />
          ))}
          {otherCount > 0 && (
            <LogLabelStatsRow
              key="__OTHERS__"
              count={otherCount}
              value="Other"
              proportion={otherProportion}
              total={total}
            />
          )}
        </div>
      </div>
    );
  }
}

export const LogLabelStats = withTheme2(UnThemedLogLabelStats);
LogLabelStats.displayName = 'LogLabelStats';
