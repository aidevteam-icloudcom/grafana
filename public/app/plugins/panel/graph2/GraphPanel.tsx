// Libraries
import _ from 'lodash';
import React, { PureComponent } from 'react';

import { Graph, PanelProps, NullValueMode, colors, TimeSeriesVMs, ColumnType, getFirstTimeColumn } from '@grafana/ui';
import { Options } from './types';
import { getFlotPairs } from '@grafana/ui/src/utils/flotPairs';

interface Props extends PanelProps<Options> {}

export class GraphPanel extends PureComponent<Props> {
  render() {
    const { data, timeRange, width, height } = this.props;
    const { showLines, showBars, showPoints } = this.props.options;

    const vmSeries: TimeSeriesVMs = [];
    for (const table of data) {
      const timeColumn = getFirstTimeColumn(table);
      if (timeColumn < 0) {
        continue;
      }

      for (let i = 0; i < table.columns.length; i++) {
        const column = table.columns[i];

        // Show all numeric columns
        if (column.type === ColumnType.number) {
          // Use external calculator just to make sure it works :)
          const points = getFlotPairs({
            rows: table.rows,
            xIndex: timeColumn,
            yIndex: i,
            nullValueMode: NullValueMode.Null,
          });

          vmSeries.push({
            label: column.text,
            data: points,
            color: colors[vmSeries.length % colors.length],

            // TODO (calculate somewhere)
            allIsNull: false,
            allIsZero: false,
          });
        }
      }
    }

    return (
      <Graph
        timeSeries={vmSeries}
        timeRange={timeRange}
        showLines={showLines}
        showPoints={showPoints}
        showBars={showBars}
        width={width}
        height={height}
      />
    );
  }
}
