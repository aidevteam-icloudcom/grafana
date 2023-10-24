import React, { useCallback, useEffect, useState } from 'react';
import { lastValueFrom } from 'rxjs';

import {
  applyFieldOverrides,
  CustomTransformOperator,
  DataFrame,
  DataTransformerConfig,
  Field,
  LogsSortOrder,
  sortDataFrame,
  SplitOpen,
  TimeRange,
  transformDataFrame,
  ValueLinkConfig,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { AdHocFilterItem, Table } from '@grafana/ui';
import { FILTER_FOR_OPERATOR, FILTER_OUT_OPERATOR } from '@grafana/ui/src/components/Table/types';
import { separateVisibleFields } from 'app/features/logs/components/logParser';
import { LogsFrame, parseLogsFrame } from 'app/features/logs/logsFrame';

import { getFieldLinksForExplore } from '../utils/links';

import { fieldNameMeta } from './LogsTableWrap';

interface Props {
  logsFrames?: DataFrame[];
  width: number;
  timeZone: string;
  splitOpen: SplitOpen;
  range: TimeRange;
  logsSortOrder: LogsSortOrder;
  columnsWithMeta: Record<string, fieldNameMeta>;
  height: number;
  onClickFilterLabel?: (key: string, value: string, refId?: string) => void;
  onClickFilterOutLabel?: (key: string, value: string, refId?: string) => void;
  datasourceType?: string;
}

export function LogsTable(props: Props) {
  const { timeZone, splitOpen, range, logsSortOrder, width, logsFrames, columnsWithMeta } = props;
  const [tableFrame, setTableFrame] = useState<DataFrame | undefined>(undefined);

  // Only a single frame (query) is supported currently
  const logFrameRaw = logsFrames ? logsFrames[0] : undefined;

  const prepareTableFrame = useCallback(
    (frame: DataFrame): DataFrame => {
      // Parse the dataframe to a logFrame
      const logsFrame = parseLogsFrame(frame);
      const timeIndex = logsFrame?.timeField.index;

      const sortedFrame = sortDataFrame(frame, timeIndex, logsSortOrder === LogsSortOrder.Descending);

      const [frameWithOverrides] = applyFieldOverrides({
        data: [sortedFrame],
        timeZone,
        theme: config.theme2,
        replaceVariables: (v: string) => v,
        fieldConfig: {
          defaults: {
            custom: {},
          },
          overrides: [],
        },
      });
      // `getLinks` and `applyFieldOverrides` are taken from TableContainer.tsx
      for (const field of frameWithOverrides.fields) {
        field.getLinks = (config: ValueLinkConfig) => {
          return getFieldLinksForExplore({
            field,
            rowIndex: config.valueRowIndex!,
            splitOpenFn: splitOpen,
            range: range,
            dataFrame: sortedFrame!,
          });
        };
        field.config = {
          ...field.config,
          custom: {
            inspect: true,
            filterable: true, // This sets the columns to be filterable
            ...field.config.custom,
          },
          // This sets the individual field value as filterable
          filterable: isFieldFilterable(field, logsFrame ?? undefined),
        };
      }

      return frameWithOverrides;
    },
    [logsSortOrder, timeZone, splitOpen, range]
  );

  useEffect(() => {
    const prepare = async () => {
      // Parse the dataframe to a logFrame
      const logsFrame = logFrameRaw ? parseLogsFrame(logFrameRaw) : undefined;

      if (!logFrameRaw || !logsFrame) {
        setTableFrame(undefined);
        return;
      }

      let dataFrame = logFrameRaw;

      // create extract JSON transformation for every field that is `json.RawMessage`
      const transformations: Array<DataTransformerConfig | CustomTransformOperator> = extractFieldsAndExclude(
        dataFrame,
        props.datasourceType
      );

      // remove hidden fields
      transformations.push(...removeHiddenFields(dataFrame));
      let labelFilters = buildLabelFilters(columnsWithMeta, logsFrame);

      // Add the label filters to the transformations
      const transform = getLabelFiltersTransform(labelFilters);
      if (transform) {
        transformations.push(transform);
      }

      if (transformations.length > 0) {
        const transformedDataFrame = await lastValueFrom(transformDataFrame(transformations, [dataFrame]));
        const tableFrame = prepareTableFrame(transformedDataFrame[0]);
        setTableFrame(tableFrame);
      } else {
        setTableFrame(prepareTableFrame(dataFrame));
      }
    };
    prepare();
  }, [columnsWithMeta, logFrameRaw, logsSortOrder, props.datasourceType, prepareTableFrame]);

  if (!tableFrame) {
    return null;
  }

  const onCellFilterAdded = (filter: AdHocFilterItem) => {
    if (!props.onClickFilterLabel || !props.onClickFilterOutLabel) {
      return;
    }
    const { value, key, operator } = filter;
    if (operator === FILTER_FOR_OPERATOR) {
      props.onClickFilterLabel(key, value);
    }

    if (operator === FILTER_OUT_OPERATOR) {
      props.onClickFilterOutLabel(key, value);
    }
  };

  return (
    <Table
      data={tableFrame}
      width={width}
      onCellFilterAdded={onCellFilterAdded}
      height={props.height}
      footerOptions={{ show: true, reducer: ['count'], countRows: true }}
    />
  );
}

const isFieldFilterable = (field: Field, logsFrame?: LogsFrame | undefined) => {
  if (!logsFrame) {
    return false;
  }
  if (logsFrame.bodyField.name === field.name) {
    return false;
  }
  if (logsFrame.timeField.name === field.name) {
    return false;
  }
  // @todo not currently excluding derived fields from filtering

  return true;
};

// TODO: explore if `logsFrame.ts` can help us with getting the right fields
// TODO Why is typeInfo not defined on the Field interface?
function extractFieldsAndExclude(dataFrame: DataFrame, datasourceType?: string) {
  return dataFrame.fields
    .filter((field: Field & { typeInfo?: { frame: string } }) => {
      return field.typeInfo?.frame === 'json.RawMessage' && datasourceType === 'loki';
    })
    .flatMap((field: Field) => {
      return [
        {
          id: 'extractFields',
          options: {
            format: 'json',
            keepTime: false,
            replace: false,
            source: field.name,
          },
        },
        // hide the field that was extracted
        {
          id: 'organize',
          options: {
            excludeByName: {
              [field.name]: true,
            },
          },
        },
      ];
    });
}

function removeHiddenFields(dataFrame: DataFrame): Array<DataTransformerConfig | CustomTransformOperator> {
  const transformations: Array<DataTransformerConfig | CustomTransformOperator> = [];
  const hiddenFields = separateVisibleFields(dataFrame, { keepBody: true, keepTimestamp: true }).hidden;
  hiddenFields.forEach((field: Field) => {
    transformations.push({
      id: 'organize',
      options: {
        excludeByName: {
          [field.name]: true,
        },
      },
    });
  });

  return transformations;
}

function buildLabelFilters(columnsWithMeta: Record<string, fieldNameMeta>, logsFrame: LogsFrame) {
  // Create object of label filters to filter out any columns not selected by the user
  let labelFilters: Record<string, true> = {};
  Object.keys(columnsWithMeta)
    .filter((key) => !columnsWithMeta[key].active)
    .forEach((key) => {
      labelFilters[key] = true;
    });

  // We could be getting fresh data
  const uniqueLabels = new Set<string>();
  const logFrameLabels = logsFrame?.getAttributesAsLabels();

  // Populate the set with all labels from latest dataframe
  logFrameLabels?.forEach((labels) => {
    Object.keys(labels).forEach((label) => {
      uniqueLabels.add(label);
    });
  });

  // Check if there are labels in the data, that aren't yet in the labelFilters, and set them to be hidden by the transform
  Object.keys(labelFilters).forEach((label) => {
    if (!uniqueLabels.has(label)) {
      labelFilters[label] = true;
    }
  });

  // Check if there are labels in the label filters that aren't yet in the data, and set those to also be hidden
  // The next time the column filters are synced any extras will be removed
  Array.from(uniqueLabels).forEach((label) => {
    if (label in columnsWithMeta && !columnsWithMeta[label]?.active) {
      labelFilters[label] = true;
    } else if (!labelFilters[label] && !(label in columnsWithMeta)) {
      labelFilters[label] = true;
    }
  });
  return labelFilters;
}

function getLabelFiltersTransform(labelFilters: Record<string, true>) {
  if (Object.keys(labelFilters).length > 0) {
    return {
      id: 'organize',
      options: {
        excludeByName: labelFilters,
      },
    };
  }
  return null;
}
