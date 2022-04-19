import React, { useLayoutEffect, useRef } from 'react';
import { TimeRange, DataFrame, AbsoluteTimeRange } from '@grafana/data';
import uPlot from 'uplot';
import { UPlotConfigBuilder, Button } from '@grafana/ui';

interface ThresholdControlsPluginProps {
  config: UPlotConfigBuilder;
  range: TimeRange;
  frame: DataFrame;
  onChangeTimeRange: (timeRange: AbsoluteTimeRange) => void;
}

export const OutsideViewPlugin: React.FC<ThresholdControlsPluginProps> = ({
  config,
  range,
  frame,
  onChangeTimeRange,
}) => {
  const plotInstance = useRef<uPlot>();

  useLayoutEffect(() => {
    config.addHook('init', (u) => {
      plotInstance.current = u;
    });
  }, [config]);

  const timevalues = plotInstance.current?.data?.[0];
  if (!timevalues || !plotInstance.current) {
    return null;
  }

  let first = timevalues[0];
  let last = timevalues[timevalues.length - 1];
  if (last < first) {
    let tmp = last;
    last = first;
    first = tmp;
  }
  const fromX = range.from.valueOf();
  const toX = range.to.valueOf();

  // (StartA <= EndB) and (EndA >= StartB)
  if (first <= toX && last >= fromX) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        overflow: 'visible',
        top: `${plotInstance.current.bbox.height / window.devicePixelRatio / 2 - 20}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div>
        <div>Data outside time range</div>
        <Button onClick={(v) => onChangeTimeRange({ from: first, to: last })} variant="secondary">
          Zoom to data
        </Button>
      </div>
    </div>
  );
};

OutsideViewPlugin.displayName = 'OutsideViewPlugin';
