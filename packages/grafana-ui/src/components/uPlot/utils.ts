import throttle from 'lodash/throttle';
import tinycolor from 'tinycolor2';
import {
  DataFrame,
  FieldConfig,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  getTimeField,
  getTimeZoneInfo,
  GrafanaTheme,
  rangeUtil,
  RawTimeRange,
  systemDateFormats,
  TimeRange,
} from '@grafana/data';
import { colors } from '../../utils';
import uPlot from 'uplot';
import { GraphCustomFieldConfig, PlotProps } from './types';

const defaultFormatter = (v: any) => (v == null ? '-' : v.toFixed(1));

const ALLOWED_FORMAT_STRINGS_REGEX = /\b(YYYY|YY|MMMM|MMM|MM|M|DD|D|WWWW|WWW|HH|H|h|AA|aa|a|mm|m|ss|s|fff)\b/g;
export const timeFormatToTemplate = (f: string) => {
  return f.replace(ALLOWED_FORMAT_STRINGS_REGEX, match => `{${match}}`);
};

const timeStampsConfig = [
  [3600 * 24 * 365, '{YYYY}', 7, '{YYYY}'],
  [3600 * 24 * 28, `{${timeFormatToTemplate(systemDateFormats.interval.month)}`, 7, '{MMM}\n{YYYY}'],
  [
    3600 * 24,
    `{${timeFormatToTemplate(systemDateFormats.interval.day)}`,
    7,
    `${timeFormatToTemplate(systemDateFormats.interval.day)}\n${timeFormatToTemplate(systemDateFormats.interval.year)}`,
  ],
  [
    3600,
    `{${timeFormatToTemplate(systemDateFormats.interval.minute)}`,
    4,
    `${timeFormatToTemplate(systemDateFormats.interval.minute)}\n${timeFormatToTemplate(
      systemDateFormats.interval.day
    )}`,
  ],
  [
    60,
    `{${timeFormatToTemplate(systemDateFormats.interval.second)}`,
    4,
    `${timeFormatToTemplate(systemDateFormats.interval.second)}\n${timeFormatToTemplate(
      systemDateFormats.interval.day
    )}`,
  ],
  [
    1,
    `:{ss}`,
    2,
    `:{ss}\n${timeFormatToTemplate(systemDateFormats.interval.day)} ${timeFormatToTemplate(
      systemDateFormats.interval.minute
    )}`,
  ],
  [
    1e-3,
    ':{ss}.{fff}',
    2,
    `:{ss}.{fff}\n${timeFormatToTemplate(systemDateFormats.interval.day)} ${timeFormatToTemplate(
      systemDateFormats.interval.minute
    )}`,
  ],
];

export function rangeToMinMax(timeRange: RawTimeRange): [number, number] {
  const v = rangeUtil.convertRawToRange(timeRange);
  return [v.from.valueOf() / 1000, v.to.valueOf() / 1000];
}

// based on aligned data frames creates config for scales, axes and series
export const buildSeriesConfig = (
  data: DataFrame,
  timeRange: TimeRange,
  theme: GrafanaTheme
): {
  series: uPlot.Series[];
  scales: Record<string, uPlot.Scale>;
  axes: uPlot.Axis[];
} => {
  const series: uPlot.Series[] = [{}];
  const scales: Record<string, uPlot.Scale> = {
    x: {
      time: true,
      range: rangeToMinMax(timeRange.raw),
    },
  };

  const axes: uPlot.Axis[] = [];

  let { timeIndex } = getTimeField(data);

  if (timeIndex === undefined) {
    timeIndex = 0; // assuming first field represents x-domain
    scales.x.time = false;
  }

  // x-axis
  axes.push({
    show: true,
    stroke: theme.colors.text,
    grid: {
      show: true,
      stroke: theme.palette.gray4,
      width: 1 / devicePixelRatio,
    },
    values: timeStampsConfig,
  });

  let seriesIdx = 0;

  for (let i = 0; i < data.fields.length; i++) {
    const field = data.fields[i];
    const config = field.config as FieldConfig<GraphCustomFieldConfig>;
    const fmt = field.display ?? defaultFormatter;

    if (i === timeIndex || field.type !== FieldType.number) {
      continue;
    }

    const scale = config.unit || '__fixed';

    if (!scales[scale]) {
      scales[scale] = {};
      axes.push({
        scale,
        label: config.custom?.axis.label,
        show: true,
        size: config.custom?.axis.width || 80,
        stroke: theme.colors.text,
        side: config.custom?.axis.side || 3,
        grid: {
          show: config.custom?.axis.grid,
          stroke: theme.palette.gray4,
          width: 1 / devicePixelRatio,
        },
        values: (u, vals) => vals.map(v => formattedValueToString(fmt(v))),
      });
    }

    series.push({
      scale,
      label: getFieldDisplayName(field, data),
      stroke: colors[seriesIdx],
      fill: config.custom?.fill.alpha
        ? tinycolor(colors[seriesIdx])
            .setAlpha(config.custom?.fill.alpha)
            .toRgbString()
        : undefined,
      width: config.custom?.line.show ? config.custom?.line.width || 1 : 0,
      points: {
        show: config.custom?.points.show,
        size: config.custom?.points.radius || 5,
      },
      spanGaps: config.custom?.nullValues === 'connected',
    });
    seriesIdx += 1;
  }

  return {
    scales,
    series,
    axes,
  };
};

export const buildPlotConfig = (props: PlotProps, data: DataFrame, theme: GrafanaTheme): uPlot.Options => {
  const seriesConfig = buildSeriesConfig(data, props.timeRange, theme);
  let tzDate;

  // When plotting time series use correct timezone for timestamps
  if (seriesConfig.scales.x.time) {
    const tz = getTimeZoneInfo(props.timeZone, Date.now())?.ianaName;
    if (tz) {
      tzDate = (ts: number) => uPlot.tzDate(new Date(ts * 1e3), tz);
    }
  }

  return {
    width: props.width,
    height: props.height,
    focus: {
      alpha: 1,
    },
    cursor: {
      focus: {
        prox: 30,
      },
    },
    legend: {
      show: false,
    },
    plugins: [],
    hooks: {},
    tzDate,
    ...seriesConfig,
  };
};

export const preparePlotData = (data: DataFrame): uPlot.AlignedData => {
  const plotData: any[] = [];

  // Prepare x axis
  let { timeIndex } = getTimeField(data);
  let xvals = data.fields[timeIndex!].values.toArray();

  if (!isNaN(timeIndex!)) {
    xvals = xvals.map(v => v / 1000);
  }

  plotData.push(xvals);

  for (let i = 0; i < data.fields.length; i++) {
    const field = data.fields[i];

    // already handled time and we ignore non-numeric fields
    if (i === timeIndex || field.type !== FieldType.number) {
      continue;
    }

    let values = field.values.toArray();

    if (field.config.custom?.nullValues === 'asZero') {
      values = values.map(v => (v === null ? 0 : v));
    }

    plotData.push(values);
  }

  console.log('Prepared Data:', plotData);
  return plotData;
};

// Dev helpers
export const throttledLog = throttle((...t: any[]) => {
  console.log(...t);
}, 500);

export const pluginLog = throttle((id: string, throttle = false, ...t: any[]) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const fn = throttle ? throttledLog : console.log;
  fn(`[Plugin: ${id}]: `, ...t);
}, 500);
