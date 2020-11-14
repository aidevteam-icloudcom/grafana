import { LegendOptions, GraphTooltipOptions } from '@grafana/ui';

export interface GraphOptions {
  // Redraw as time passes
  realTimeUpdates?: boolean;
}

export interface Options {
  graph: GraphOptions;
  legend: LegendOptions;
  tooltipOptions: GraphTooltipOptions;
}

export interface GraphLegendEditorLegendOptions extends LegendOptions {
  stats?: string[];
  decimals?: number;
  sortBy?: string;
  sortDesc?: boolean;
}
