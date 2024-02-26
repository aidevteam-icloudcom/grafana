import { cloneDeep } from 'lodash';
import uPlot, { Padding } from 'uplot';

import {
  DataFrame,
  Field,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldColorModeForField,
  cacheFieldDisplayNames,
  getFieldSeriesColor,
  GrafanaTheme2,
  outerJoinDataFrames,
  TimeZone,
  VizOrientation,
  getFieldDisplayName,
} from '@grafana/data';
import { maybeSortFrame } from '@grafana/data/src/transformations/transformers/joinDataFrames';
import { config as runtimeConfig } from '@grafana/runtime';
import {
  AxisColorMode,
  AxisPlacement,
  GraphTransform,
  GraphThresholdsStyleMode,
  ScaleDirection,
  ScaleDistribution,
  ScaleOrientation,
  StackingMode,
  VizLegendOptions,
} from '@grafana/schema';
import { FIXED_UNIT, measureText, UPlotConfigBuilder, UPlotConfigPrepFn, UPLOT_AXIS_FONT_SIZE } from '@grafana/ui';
import { AxisProps } from '@grafana/ui/src/components/uPlot/config/UPlotAxisBuilder';
import { getStackingGroups } from '@grafana/ui/src/components/uPlot/utils';
import { findField } from 'app/features/dimensions';

import { setClassicPaletteIdxs } from '../timeseries/utils';

import { BarsOptions, getConfig } from './bars';
import { FieldConfig, Options, defaultFieldConfig } from './panelcfg.gen';
import { BarChartDisplayValues, BarChartDisplayWarning } from './types';

function getBarCharScaleOrientation(orientation: VizOrientation) {
  if (orientation === VizOrientation.Vertical) {
    return {
      xOri: ScaleOrientation.Horizontal,
      xDir: ScaleDirection.Right,
      yOri: ScaleOrientation.Vertical,
      yDir: ScaleDirection.Up,
    };
  }

  return {
    xOri: ScaleOrientation.Vertical,
    xDir: ScaleDirection.Down,
    yOri: ScaleOrientation.Horizontal,
    yDir: ScaleDirection.Right,
  };
}

export interface BarChartOptionsEX extends Options {
  rawValue: (seriesIdx: number, valueIdx: number) => number | null;
  getColor?: (seriesIdx: number, valueIdx: number, value: unknown) => string | null;
  timeZone?: TimeZone;
  fillOpacity?: number;
  hoverMulti?: boolean;
}

export const preparePlotConfigBuilder: UPlotConfigPrepFn<BarChartOptionsEX> = ({
  frame,
  theme,
  orientation,
  showValue,
  groupWidth,
  barWidth,
  barRadius = 0,
  stacking,
  text,
  rawValue,
  getColor,
  fillOpacity,
  allFrames,
  xTickLabelRotation,
  xTickLabelMaxLength,
  xTickLabelSpacing = 0,
  legend,
  timeZone,
  fullHighlight,
  hoverMulti,
}) => {
  const builder = new UPlotConfigBuilder();

  const formatValue = (seriesIdx: number, value: unknown) => {
    return formattedValueToString(frame.fields[seriesIdx].display!(value));
  };

  const formatShortValue = (seriesIdx: number, value: unknown) => {
    return shortenValue(formatValue(seriesIdx, value), xTickLabelMaxLength);
  };

  // bar orientation -> x scale orientation & direction
  const vizOrientation = getBarCharScaleOrientation(orientation);

  // Use bar width when only one field
  if (frame.fields.length === 2) {
    groupWidth = barWidth;
    barWidth = 1;
  }

  const opts: BarsOptions = {
    xOri: vizOrientation.xOri,
    xDir: vizOrientation.xDir,
    groupWidth,
    barWidth,
    barRadius,
    stacking,
    rawValue,
    getColor,
    fillOpacity,
    formatValue,
    formatShortValue,
    timeZone,
    text,
    showValue,
    legend,
    xSpacing: xTickLabelSpacing,
    xTimeAuto: frame.fields[0]?.type === FieldType.time && !frame.fields[0].config.unit?.startsWith('time:'),
    negY: frame.fields.map((f) => f.config.custom?.transform === GraphTransform.NegativeY),
    fullHighlight,
    hoverMulti,
  };

  const config = getConfig(opts, theme);

  builder.setCursor(config.cursor);

  builder.addHook('init', config.init);
  builder.addHook('drawClear', config.drawClear);
  builder.addHook('draw', config.draw);

  const showNewVizTooltips = Boolean(runtimeConfig.featureToggles.newVizTooltips);
  showNewVizTooltips && builder.setTooltipInterpolator(config.interpolateTooltip);

  if (xTickLabelRotation !== 0) {
    // these are the amount of space we already have available between plot edge and first label
    // TODO: removing these hardcoded value requires reading back uplot instance props
    let lftSpace = 50;
    let btmSpace = vizOrientation.xOri === ScaleOrientation.Horizontal ? 14 : 5;

    builder.setPadding(getRotationPadding(frame, xTickLabelRotation, xTickLabelMaxLength, lftSpace, btmSpace));
  }

  builder.setPrepData(config.prepData);

  builder.addScale({
    scaleKey: 'x',
    isTime: false,
    range: config.xRange,
    distribution: ScaleDistribution.Ordinal,
    orientation: vizOrientation.xOri,
    direction: vizOrientation.xDir,
  });

  const xFieldAxisPlacement =
    frame.fields[0].config.custom?.axisPlacement !== AxisPlacement.Hidden
      ? vizOrientation.xOri === ScaleOrientation.Horizontal
        ? AxisPlacement.Bottom
        : AxisPlacement.Left
      : AxisPlacement.Hidden;
  const xFieldAxisShow = frame.fields[0].config.custom?.axisPlacement !== AxisPlacement.Hidden;

  builder.addAxis({
    scaleKey: 'x',
    isTime: false,
    placement: xFieldAxisPlacement,
    label: frame.fields[0].config.custom?.axisLabel,
    splits: config.xSplits,
    filter: vizOrientation.xOri === 0 ? config.hFilter : undefined,
    values: config.xValues,
    timeZone,
    grid: { show: false },
    ticks: { show: false },
    gap: 15,
    tickLabelRotation: vizOrientation.xOri === 0 ? xTickLabelRotation * -1 : 0,
    theme,
    show: xFieldAxisShow,
  });

  let seriesIndex = 0;
  const legendOrdered = isLegendOrdered(legend);

  // iterate the y values
  for (let i = 1; i < frame.fields.length; i++) {
    const field = frame.fields[i];

    seriesIndex++;

    const customConfig: FieldConfig = { ...defaultFieldConfig, ...field.config.custom };

    const scaleKey = field.config.unit || FIXED_UNIT;
    const colorMode = getFieldColorModeForField(field);
    const scaleColor = getFieldSeriesColor(field, theme);
    const seriesColor = scaleColor.color;

    // make barcharts start at 0 unless explicitly overridden
    let softMin = customConfig.axisSoftMin;
    let softMax = customConfig.axisSoftMax;

    if (softMin == null && field.config.min == null) {
      softMin = 0;
    }

    if (softMax == null && field.config.max == null) {
      softMax = 0;
    }

    // Render thresholds in graph
    if (customConfig.thresholdsStyle && field.config.thresholds) {
      const thresholdDisplay = customConfig.thresholdsStyle.mode ?? GraphThresholdsStyleMode.Off;
      if (thresholdDisplay !== GraphThresholdsStyleMode.Off) {
        builder.addThresholds({
          config: customConfig.thresholdsStyle,
          thresholds: field.config.thresholds,
          scaleKey,
          theme,
          hardMin: field.config.min,
          hardMax: field.config.max,
          softMin: customConfig.axisSoftMin,
          softMax: customConfig.axisSoftMax,
        });
      }
    }

    builder.addSeries({
      scaleKey,
      pxAlign: true,
      lineWidth: customConfig.lineWidth,
      lineColor: seriesColor,
      fillOpacity: customConfig.fillOpacity,
      theme,
      colorMode,
      pathBuilder: config.barsBuilder,
      show: !customConfig.hideFrom?.viz,
      gradientMode: customConfig.gradientMode,
      thresholds: field.config.thresholds,
      hardMin: field.config.min,
      hardMax: field.config.max,
      softMin: customConfig.axisSoftMin,
      softMax: customConfig.axisSoftMax,

      // The following properties are not used in the uPlot config, but are utilized as transport for legend config
      // PlotLegend currently gets unfiltered DataFrame[], so index must be into that field array, not the prepped frame's which we're iterating here
      dataFrameFieldIndex: {
        fieldIndex: legendOrdered
          ? i
          : allFrames[0].fields.findIndex(
              (f) => f.type === FieldType.number && f.state?.seriesIndex === seriesIndex - 1
            ),
        frameIndex: 0,
      },
    });

    // The builder will manage unique scaleKeys and combine where appropriate
    builder.addScale({
      scaleKey,
      min: field.config.min,
      max: field.config.max,
      softMin,
      softMax,
      centeredZero: customConfig.axisCenteredZero,
      orientation: vizOrientation.yOri,
      direction: vizOrientation.yDir,
      distribution: customConfig.scaleDistribution?.type,
      log: customConfig.scaleDistribution?.log,
    });

    if (customConfig.axisPlacement !== AxisPlacement.Hidden) {
      let placement = customConfig.axisPlacement;
      if (!placement || placement === AxisPlacement.Auto) {
        placement = AxisPlacement.Left;
      }
      if (vizOrientation.xOri === 1) {
        if (placement === AxisPlacement.Left) {
          placement = AxisPlacement.Bottom;
        }
        if (placement === AxisPlacement.Right) {
          placement = AxisPlacement.Top;
        }
      }

      let axisOpts: AxisProps = {
        scaleKey,
        label: customConfig.axisLabel,
        size: customConfig.axisWidth,
        placement,
        formatValue: (v, decimals) => formattedValueToString(field.display!(v, decimals)),
        filter: vizOrientation.yOri === 0 ? config.hFilter : undefined,
        tickLabelRotation: vizOrientation.xOri === 1 ? xTickLabelRotation * -1 : 0,
        theme,
        grid: { show: customConfig.axisGridShow },
      };

      if (customConfig.axisBorderShow) {
        axisOpts.border = {
          show: true,
        };
      }

      if (customConfig.axisColorMode === AxisColorMode.Series) {
        axisOpts.color = seriesColor;
      }

      builder.addAxis(axisOpts);
    }
  }

  let stackingGroups = getStackingGroups(frame);

  builder.setStackingGroups(stackingGroups);

  return builder;
};

function shortenValue(value: string, length: number) {
  if (value.length > length) {
    return value.substring(0, length).concat('...');
  } else {
    return value;
  }
}

function getRotationPadding(
  frame: DataFrame,
  rotateLabel: number,
  valueMaxLength: number,
  lftSpace = 0,
  btmSpace = 0
): Padding {
  const values = frame.fields[0].values;
  const fontSize = UPLOT_AXIS_FONT_SIZE;
  const displayProcessor = frame.fields[0].display;
  const getProcessedValue = (i: number) => {
    return displayProcessor ? displayProcessor(values[i]) : values[i];
  };
  let maxLength = 0;
  for (let i = 0; i < values.length; i++) {
    let size = measureText(shortenValue(formattedValueToString(getProcessedValue(i)), valueMaxLength), fontSize);
    maxLength = size.width > maxLength ? size.width : maxLength;
  }

  // Add padding to the right if the labels are rotated in a way that makes the last label extend outside the graph.
  const paddingRight =
    rotateLabel > 0
      ? Math.cos((rotateLabel * Math.PI) / 180) *
        measureText(
          shortenValue(formattedValueToString(getProcessedValue(values.length - 1)), valueMaxLength),
          fontSize
        ).width
      : 0;

  // Add padding to the left if the labels are rotated in a way that makes the first label extend outside the graph.
  const paddingLeft =
    rotateLabel < 0
      ? Math.cos((rotateLabel * -1 * Math.PI) / 180) *
        measureText(shortenValue(formattedValueToString(getProcessedValue(0)), valueMaxLength), fontSize).width
      : 0;

  // Add padding to the bottom to avoid clipping the rotated labels.
  const paddingBottom =
    Math.sin(((rotateLabel >= 0 ? rotateLabel : rotateLabel * -1) * Math.PI) / 180) * maxLength - btmSpace;

  return [
    Math.round(UPLOT_AXIS_FONT_SIZE * uPlot.pxRatio),
    paddingRight,
    paddingBottom,
    Math.max(0, paddingLeft - lftSpace),
  ];
}

/** @internal */
export function prepareBarChartDisplayValues(
  series: DataFrame[],
  theme: GrafanaTheme2,
  options: Options
): BarChartDisplayValues | BarChartDisplayWarning {
  if (!series.length || series.every((fr) => fr.length === 0)) {
    return { warn: 'No data in response' };
  }

  cacheFieldDisplayNames(series);

  // Bar chart requires a single frame
  const frame =
    series.length === 1
      ? maybeSortFrame(
          series[0],
          series[0].fields.findIndex((f) => f.type === FieldType.time)
        )
      : outerJoinDataFrames({ frames: series, keepDisplayNames: true });

  if (!frame) {
    return { warn: 'Unable to join data' };
  }

  setClassicPaletteIdxs([frame], theme, 0);

  // Color by a field different than the input
  let colorByField: Field | undefined = undefined;
  if (options.colorByField) {
    colorByField = findField(frame, options.colorByField);
    if (!colorByField) {
      return { warn: 'Color field not found' };
    }
  }

  let xField: Field | undefined = undefined;
  if (options.xField) {
    xField = findField(frame, options.xField);
    if (!xField) {
      return { warn: 'Configured x field not found' };
    }
  }

  let stringField: Field | undefined = undefined;
  let timeField: Field | undefined = undefined;
  let fields: Field[] = [];
  for (const field of frame.fields) {
    if (field === xField) {
      continue;
    }

    switch (field.type) {
      case FieldType.string:
        if (!stringField) {
          stringField = field;
        }
        break;

      case FieldType.time:
        if (!timeField) {
          timeField = field;
        }
        break;

      case FieldType.number: {
        const copy = {
          ...field,
          state: {
            ...field.state,
            seriesIndex: fields.length, // off by one?
          },
          config: {
            ...field.config,
            custom: {
              ...field.config.custom,
              stacking: {
                group: '_',
                mode: options.stacking,
              },
            },
          },
          values: field.values.map((v) => {
            if (!(Number.isFinite(v) || v == null)) {
              return null;
            }
            return v;
          }),
        };

        if (options.stacking === StackingMode.Percent) {
          copy.config.unit = 'percentunit';
          copy.display = getDisplayProcessor({ field: copy, theme });
        }

        fields.push(copy);
      }
    }
  }

  let firstField = xField;
  if (!firstField) {
    firstField = stringField || timeField;
  }

  if (!firstField) {
    return {
      warn: 'Bar charts requires a string or time field',
    };
  }

  if (!fields.length) {
    return {
      warn: 'No numeric fields found',
    };
  }

  // Show the first number value
  if (colorByField && fields.length > 1) {
    const firstNumber = fields.find((f) => f !== colorByField);
    if (firstNumber) {
      fields = [firstNumber];
    }
  }

  // If stacking is percent, we need to correct the legend fields unit and display
  let legendFields: Field[] = cloneDeep(fields);
  if (options.stacking === StackingMode.Percent) {
    legendFields.map((field) => {
      const alignedFrameField = frame.fields.find(
        (f) => getFieldDisplayName(f, frame) === getFieldDisplayName(f, frame)
      );

      field.config.unit = alignedFrameField?.config?.unit ?? undefined;
      field.display = getDisplayProcessor({ field: field, theme });
    });
  }

  // String field is first, make sure fields / legend fields indexes match
  fields.unshift(firstField);
  legendFields.unshift(firstField);

  return {
    aligned: frame,
    colorByField,
    viz: [
      {
        fields: fields, // ideally: fields.filter((f) => !Boolean(f.config.custom?.hideFrom?.viz)),
        length: firstField.values.length,
      },
    ],
    legend: {
      fields: legendFields,
      length: firstField.values.length,
    },
  };
}

export const isLegendOrdered = (options: VizLegendOptions) => Boolean(options?.sortBy && options.sortDesc !== null);
