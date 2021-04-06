import React from 'react';
import { GraphNGLegendEventMode, XYFieldMatchers } from '../GraphNG/types';
import {
  DataFrame,
  FieldColorModeId,
  FieldConfig,
  formattedValueToString,
  getFieldDisplayName,
  GrafanaTheme,
  outerJoinDataFrames,
  TimeRange,
  TimeZone,
  classicColors,
} from '@grafana/data';
import { UPlotConfigBuilder } from '../uPlot/config/UPlotConfigBuilder';
import { TimelineCoreOptions, getConfig } from './timeline';
import { FIXED_UNIT } from '../GraphNG/GraphNG';
import { AxisPlacement, GraphGradientMode, ScaleDirection, ScaleOrientation } from '../uPlot/config';
import { measureText } from '../../utils/measureText';

import { TimelineFieldConfig } from '../..';

const defaultConfig: TimelineFieldConfig = {
  lineWidth: 0,
  fillOpacity: 80,
  gradientMode: GraphGradientMode.None,
};

export function mapMouseEventToMode(event: React.MouseEvent): GraphNGLegendEventMode {
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    return GraphNGLegendEventMode.AppendToSelection;
  }
  return GraphNGLegendEventMode.ToggleSelection;
}

export function preparePlotFrame(data: DataFrame[], dimFields: XYFieldMatchers) {
  return outerJoinDataFrames({
    frames: data,
    joinBy: dimFields.x,
    keep: dimFields.y,
    keepOriginIndices: true,
  });
}

export type uPlotConfigBuilderSupplier = (
  frame: DataFrame,
  theme: GrafanaTheme,
  getTimeRange: () => TimeRange,
  getTimeZone: () => TimeZone
) => UPlotConfigBuilder;

export function preparePlotConfigBuilder(
  frame: DataFrame,
  theme: GrafanaTheme,
  getTimeRange: () => TimeRange,
  getTimeZone: () => TimeZone,
  coreOptions: Partial<TimelineCoreOptions>
): UPlotConfigBuilder {
  const builder = new UPlotConfigBuilder(getTimeZone);

  const colorLookup = (seriesIdx: number, valueIdx: number, value: any) => {
    const field = frame.fields[seriesIdx];
    const mode = field.config?.color?.mode;
    if (mode && field.display && (mode === FieldColorModeId.Thresholds || mode?.startsWith('continuous-'))) {
      const disp = field.display(value); // will apply color modes
      if (disp.color) {
        return disp.color;
      }
    }
    return classicColors[Math.floor(value % classicColors.length)];
  };

  const yAxisWidth =
    frame.fields.reduce((maxWidth, field) => {
      return Math.max(
        maxWidth,
        measureText(getFieldDisplayName(field, frame), Math.round(10 * devicePixelRatio)).width
      );
    }, 0) + 24;

  const opts: TimelineCoreOptions = {
    // should expose in panel config
    mode: coreOptions.mode!,
    numSeries: frame.fields.length - 1,
    rowHeight: coreOptions.rowHeight!,
    colWidth: coreOptions.colWidth,
    showValue: coreOptions.showValue!,
    label: (seriesIdx) => getFieldDisplayName(frame.fields[seriesIdx], frame),
    fill: colorLookup,
    stroke: colorLookup,
    getTimeRange,
    // hardcoded formatter for state values
    formatValue: (seriesIdx, value) => formattedValueToString(frame.fields[seriesIdx].display!(value)),
    // TODO: unimplemeted for now
    onHover: (seriesIdx: number, valueIdx: number) => {
      console.log('hover', { seriesIdx, valueIdx });
    },
    onLeave: (seriesIdx: number, valueIdx: number) => {
      console.log('leave', { seriesIdx, valueIdx });
    },
  };

  const coreConfig = getConfig(opts);

  builder.addHook('init', coreConfig.init);
  builder.addHook('drawClear', coreConfig.drawClear);
  builder.addHook('setCursor', coreConfig.setCursor);

  builder.setCursor(coreConfig.cursor);

  builder.addScale({
    scaleKey: 'x',
    isTime: true,
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    range: coreConfig.xRange,
  });

  builder.addScale({
    scaleKey: FIXED_UNIT, // y
    isTime: false,
    orientation: ScaleOrientation.Vertical,
    direction: ScaleDirection.Up,
    range: coreConfig.yRange,
  });

  builder.addAxis({
    scaleKey: 'x',
    isTime: true,
    splits: coreConfig.xSplits!,
    placement: AxisPlacement.Bottom,
    timeZone: getTimeZone(),
    theme,
  });

  builder.addAxis({
    scaleKey: FIXED_UNIT, // y
    isTime: false,
    placement: AxisPlacement.Left,
    splits: coreConfig.ySplits,
    values: coreConfig.yValues,
    grid: false,
    ticks: false,
    size: yAxisWidth,
    gap: 16,
    theme,
  });

  let seriesIndex = 0;

  for (let i = 0; i < frame.fields.length; i++) {
    if (i === 0) {
      continue;
    }

    const field = frame.fields[i];
    const config = field.config as FieldConfig<TimelineFieldConfig>;
    const customConfig: TimelineFieldConfig = {
      ...defaultConfig,
      ...config.custom,
    };

    field.state!.seriesIndex = seriesIndex++;

    //const scaleKey = config.unit || FIXED_UNIT;
    //const colorMode = getFieldColorModeForField(field);

    let { fillOpacity } = customConfig;

    builder.addSeries({
      scaleKey: FIXED_UNIT,
      pathBuilder: coreConfig.drawPaths,
      pointsBuilder: coreConfig.drawPoints,
      //colorMode,
      fillOpacity,
      theme,
      show: !customConfig.hideFrom?.graph,
      thresholds: config.thresholds,

      // The following properties are not used in the uPlot config, but are utilized as transport for legend config
      dataFrameFieldIndex: field.state?.origin,
      fieldName: getFieldDisplayName(field, frame),
      hideInLegend: customConfig.hideFrom?.legend,
    });
  }

  return builder;
}

export function getNamesToFieldIndex(frame: DataFrame): Map<string, number> {
  const names = new Map<string, number>();
  for (let i = 0; i < frame.fields.length; i++) {
    names.set(getFieldDisplayName(frame.fields[i], frame), i);
  }
  return names;
}
