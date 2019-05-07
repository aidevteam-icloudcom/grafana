import { VizOrientation, ReducerID, SingleStatBaseOptions, FieldDisplayOptions } from '@grafana/ui';

export interface SparklineOptions {
  show: boolean;
  full: boolean; // full height
  fillColor: string;
  lineColor: string;
}

// Structure copied from angular
export interface SingleStatOptions extends SingleStatBaseOptions {
  prefixFontSize?: string;
  valueFontSize?: string;
  postfixFontSize?: string;

  colorBackground?: boolean;
  colorValue?: boolean;
  colorPrefix?: boolean;
  colorPostfix?: boolean;

  sparkline: SparklineOptions;
}

export const standardFieldDisplayOptions: FieldDisplayOptions = {
  values: false,
  calcs: [ReducerID.mean],
  defaults: {
    scale: {
      thresholds: [
        { value: -Infinity, color: 'green' }, // Base
        { value: 80, color: 'red' },
      ], // 80%
    },
  },
  override: {},
  mappings: [],
};

export const defaults: SingleStatOptions = {
  sparkline: {
    show: true,
    full: false,
    lineColor: 'rgb(31, 120, 193)',
    fillColor: 'rgba(31, 118, 189, 0.18)',
  },
  fieldOptions: standardFieldDisplayOptions,
  orientation: VizOrientation.Auto,
};
