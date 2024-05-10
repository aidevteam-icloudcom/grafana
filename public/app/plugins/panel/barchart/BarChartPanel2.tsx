import React, { useMemo } from 'react';

import { PanelProps, VizOrientation } from '@grafana/data';
import {
  TooltipDisplayMode,
  TooltipPlugin2,
  UPLOT_AXIS_FONT_SIZE,
  UPlotChart,
  VizLayout,
  measureText,
  // usePanelContext,
  useTheme2,
} from '@grafana/ui';
import { TooltipHoverMode } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';

import { TimeSeriesTooltip } from '../timeseries/TimeSeriesTooltip';

import { BarChartLegend2, hasVisibleLegendSeries } from './BarChartLegend2';
import { Options } from './panelcfg.gen';
import { prepConfig, prepSeries } from './utils2';

const charWidth = measureText('M', UPLOT_AXIS_FONT_SIZE).width;
const toRads = Math.PI / 180;

export const BarChartPanel = (props: PanelProps<Options>) => {
  const { data, options, fieldConfig, width, height, timeZone, id, replaceVariables } = props;
  // const { dataLinkPostProcessor } = usePanelContext(); // will need this if joining on time to re-create data links

  const theme = useTheme2();

  const {
    barWidth,
    barRadius = 0,
    showValue,
    groupWidth,
    stacking,
    legend,
    tooltip,
    text,
    xTickLabelRotation,
    xTickLabelSpacing,
    fullHighlight,
    xField,
    colorByField,
  } = options;

  // size-dependent, calculated opts that should cause viz re-config
  let { orientation, xTickLabelMaxLength = 0 } = options;

  orientation =
    orientation === VizOrientation.Auto
      ? width < height
        ? VizOrientation.Horizontal
        : VizOrientation.Vertical
      : orientation;

  // TODO: this can be moved into axis calc internally, no need to re-config based on this
  // should be based on vizHeight, not full height?
  xTickLabelMaxLength =
    xTickLabelRotation === 0
      ? Infinity // should this calc using spacing between groups?
      : xTickLabelMaxLength ||
        // auto max length clamps to half viz height, subracts 3 chars for ... ellipsis
        Math.floor(height / 2 / Math.sin(Math.abs(xTickLabelRotation * toRads)) / charWidth - 3);

  // TODO: config data links
  const info = useMemo(
    () => prepSeries(data.series, fieldConfig, stacking, theme, xField, colorByField),
    [data.series, fieldConfig, stacking, theme, xField, colorByField]
  );

  const vizSeries = useMemo(
    () => [
      {
        ...info.series![0],
        fields: info.series![0].fields.filter((field, i) => i === 0 || !field.state?.hideFrom?.viz),
      },
    ],
    [info.series]
  );

  const xGroupsCount = vizSeries[0].length;
  const seriesCount = vizSeries[0].fields?.length;

  let { builder, prepData } = useMemo(
    () => {
      console.log('invaidate!');

      return prepConfig({ series: vizSeries, color: info.color, orientation, options, timeZone, theme });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      orientation,
      timeZone,
      props.data.structureRev,

      seriesCount,
      xGroupsCount,

      barWidth,
      barRadius,
      showValue,
      groupWidth,
      stacking,
      legend,
      tooltip,
      text?.valueSize, // cause text obj is re-created each time?
      xTickLabelRotation,
      xTickLabelSpacing,
      fullHighlight,
      xField,
      colorByField,
      xTickLabelMaxLength, // maybe not?
      // props.fieldConfig, // usePrevious hideFrom on all fields?
    ]
  );

  const plotData = useMemo(() => prepData(vizSeries, info.color), [prepData, vizSeries, info.color]);

  // if ('warn' in info) {
  //   return (
  //     <PanelDataErrorView
  //       panelId={id}
  //       fieldConfig={fieldConfig}
  //       data={data}
  //       message={info.warn}
  //       needsNumberField={true}
  //     />
  //   );
  // }

  const legendComp =
    legend.showLegend && hasVisibleLegendSeries(builder, info.series!) ? (
      <BarChartLegend2 data={info.series!} colorField={info.color} {...legend} />
    ) : null;

  return (
    <VizLayout
      width={props.width}
      height={props.height}
      // legend={<BarChartLegend frame={info.series![0]} colorField={info.color} {...legend} />}
      legend={legendComp}
    >
      {(vizWidth, vizHeight) => (
        <UPlotChart config={builder!} data={plotData} width={vizWidth} height={vizHeight}>
          {props.options.tooltip.mode !== TooltipDisplayMode.None && (
            <TooltipPlugin2
              config={builder}
              maxWidth={options.tooltip.maxWidth}
              hoverMode={
                options.tooltip.mode === TooltipDisplayMode.Single ? TooltipHoverMode.xOne : TooltipHoverMode.xAll
              }
              render={(u, dataIdxs, seriesIdx, isPinned, dismiss, timeRange2) => {
                return (
                  <TimeSeriesTooltip
                    series={vizSeries[0]}
                    _rest={info._rest}
                    dataIdxs={dataIdxs}
                    seriesIdx={seriesIdx}
                    mode={options.tooltip.mode}
                    sortOrder={options.tooltip.sort}
                    isPinned={isPinned}
                    maxHeight={options.tooltip.maxHeight}
                  />
                );
              }}
            />
          )}
        </UPlotChart>
      )}
    </VizLayout>
  );
};
