import { PanelBuilders, SceneFlexItem, SceneQueryRunner, SceneTimeRange } from '@grafana/scenes';
import { DataSourceRef, GraphDrawStyle } from '@grafana/schema';

const RATE_FIRING = 'sum(count_over_time({from="state-history"} | json | current="Alerting"[5m]))';

export function getFiringAlertsRateScene(timeRange: SceneTimeRange, datasource: DataSourceRef, panelTitle: string) {
  const query = new SceneQueryRunner({
    datasource,
    queries: [
      {
        refId: 'A',
        expr: RATE_FIRING,
        range: true,
      },
    ],
    $timeRange: timeRange,
  });

  return new SceneFlexItem({
    width: '100%',
    height: 300,
    body: PanelBuilders.timeseries()
      .setTitle(panelTitle)
      .setData(query)
      .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
      .setOverrides((b) => b.matchFieldsWithName('{}').overrideDisplayName('Number of fires'))
      .build(),
  });
}
