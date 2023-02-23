import React, { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';

import { CoreApp, SelectableValue, TimeRange } from '@grafana/data';
import { EditorField, EditorRow } from '@grafana/experimental';
import { reportInteraction } from '@grafana/runtime';
import { RadioButtonGroup, Select, AutoSizeInput } from '@grafana/ui';
import { QueryOptionGroup } from 'app/plugins/datasource/prometheus/querybuilder/shared/QueryOptionGroup';

import { preprocessMaxLines, queryTypeOptions, RESOLUTION_OPTIONS } from '../../components/LokiOptionFields';
import { LokiDatasource } from '../../datasource';
import { isLogsQuery } from '../../queryUtils';
import { LokiQuery, LokiQueryType, QueryStats } from '../../types';

export interface Props {
  query: LokiQuery;
  onChange: (update: LokiQuery) => void;
  onRunQuery: () => void;
  maxLines: number;
  app?: CoreApp;
  datasource: LokiDatasource;
}

export const LokiQueryBuilderOptions = React.memo<Props>(
  ({ app, query, onChange, onRunQuery, maxLines, datasource }) => {
    const [queryStats, setQueryStats] = useState<QueryStats>();

    const timerange = datasource.getTimeRange();
    const previousTimerange = usePrevious(timerange);
    const previousQuery = usePrevious(query);

    const onQueryTypeChange = (value: LokiQueryType) => {
      onChange({ ...query, queryType: value });
      onRunQuery();
    };

    const onResolutionChange = (option: SelectableValue<number>) => {
      reportInteraction('grafana_loki_resolution_clicked', {
        app,
        resolution: option.value,
      });
      onChange({ ...query, resolution: option.value });
      onRunQuery();
    };

    const onLegendFormatChanged = (evt: React.FormEvent<HTMLInputElement>) => {
      onChange({ ...query, legendFormat: evt.currentTarget.value });
      onRunQuery();
    };

    function onMaxLinesChange(e: React.SyntheticEvent<HTMLInputElement>) {
      const newMaxLines = preprocessMaxLines(e.currentTarget.value);
      if (query.maxLines !== newMaxLines) {
        onChange({ ...query, maxLines: newMaxLines });
        onRunQuery();
      }
    }

    useEffect(() => {
      makeStatsRequest(datasource, timerange, previousTimerange, query, previousQuery, setQueryStats);
    }, [datasource, timerange, previousTimerange, query, previousQuery, setQueryStats]);

    let queryType = query.queryType ?? (query.instant ? LokiQueryType.Instant : LokiQueryType.Range);
    let showMaxLines = isLogsQuery(query.expr);

    return (
      <EditorRow>
        <QueryOptionGroup
          title="Options"
          collapsedInfo={getCollapsedInfo(query, queryType, showMaxLines, maxLines)}
          queryStats={queryStats}
        >
          <EditorField
            label="Legend"
            tooltip="Series name override or template. Ex. {{hostname}} will be replaced with label value for hostname."
          >
            <AutoSizeInput
              placeholder="{{label}}"
              id="loki-query-editor-legend-format"
              type="string"
              minWidth={14}
              defaultValue={query.legendFormat}
              onCommitChange={onLegendFormatChanged}
            />
          </EditorField>
          <EditorField label="Type">
            <RadioButtonGroup options={queryTypeOptions} value={queryType} onChange={onQueryTypeChange} />
          </EditorField>
          {showMaxLines && (
            <EditorField label="Line limit" tooltip="Upper limit for number of log lines returned by query.">
              <AutoSizeInput
                className="width-4"
                placeholder={maxLines.toString()}
                type="number"
                min={0}
                defaultValue={query.maxLines?.toString() ?? ''}
                onCommitChange={onMaxLinesChange}
              />
            </EditorField>
          )}
          <EditorField label="Resolution">
            <Select
              isSearchable={false}
              onChange={onResolutionChange}
              options={RESOLUTION_OPTIONS}
              value={query.resolution || 1}
              aria-label="Select resolution"
            />
          </EditorField>
        </QueryOptionGroup>
      </EditorRow>
    );
  }
);

function getCollapsedInfo(
  query: LokiQuery,
  queryType: LokiQueryType,
  showMaxLines: boolean,
  maxLines: number
): string[] {
  const queryTypeLabel = queryTypeOptions.find((x) => x.value === queryType);
  const resolutionLabel = RESOLUTION_OPTIONS.find((x) => x.value === (query.resolution ?? 1));

  const items: string[] = [];

  if (query.legendFormat) {
    items.push(`Legend: ${query.legendFormat}`);
  }

  if (query.resolution) {
    items.push(`Resolution: ${resolutionLabel?.label}`);
  }

  items.push(`Type: ${queryTypeLabel?.label}`);

  if (showMaxLines) {
    items.push(`Line limit: ${query.maxLines ?? maxLines}`);
  }

  return items;
}

export async function makeStatsRequest(
  datasource: LokiDatasource,
  timerange: TimeRange,
  prevTimerange: TimeRange | undefined,
  query: LokiQuery,
  prevQuery: LokiQuery | undefined,
  setQueryStats: ((stats: QueryStats | undefined) => void) | undefined // REMOVE UNDEFINED ONCE FIXED (see below)
  // to fix this i need to make setQueryStats available in MonacoQueryField.tsx
) {
  if (
    query.expr === prevQuery?.expr &&
    timerange.raw.from === prevTimerange?.raw.from &&
    timerange.raw.to === prevTimerange?.raw.to
  ) {
    return;
  }

  if (!query.expr) {
    setQueryStats?.(undefined); // REMOVE ? ONCE FIXED
    return;
  }

  const response = await datasource.getQueryStats(query);
  console.log('stats has been requested:', response);

  Object.values(response).every((v) => v === 0) ? setQueryStats?.(undefined) : setQueryStats?.(response); // REMOVE ? ONCE FIXED
}

LokiQueryBuilderOptions.displayName = 'LokiQueryBuilderOptions';
