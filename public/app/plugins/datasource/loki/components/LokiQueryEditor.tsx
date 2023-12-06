import { isEqual } from 'lodash';
import React, { SyntheticEvent, useCallback, useEffect, useId, useState } from 'react';
import { usePrevious } from 'react-use';

import { LoadingState } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { EditorHeader, EditorRows, FlexItem, Space, Stack } from '@grafana/experimental';
import { config, reportInteraction } from '@grafana/runtime';
import { Button, ConfirmModal } from '@grafana/ui';
import { QueryEditorModeToggle } from 'app/plugins/datasource/prometheus/querybuilder/shared/QueryEditorModeToggle';
import { QueryHeaderSwitch } from 'app/plugins/datasource/prometheus/querybuilder/shared/QueryHeaderSwitch';
import { QueryEditorMode } from 'app/plugins/datasource/prometheus/querybuilder/shared/types';

import { QueryOptionGroup } from '../../prometheus/querybuilder/shared/QueryOptionGroup';
import { lokiQueryEditorExplainKey, useFlag } from '../../prometheus/querybuilder/shared/hooks/useFlag';
import { LabelBrowserModal } from '../querybuilder/components/LabelBrowserModal';
import { LokiQueryBuilderContainer } from '../querybuilder/components/LokiQueryBuilderContainer';
import { LokiQueryCodeEditor } from '../querybuilder/components/LokiQueryCodeEditor';
import { QueryPatternsModal } from '../querybuilder/components/QueryPatternsModal';
import { buildVisualQueryFromString } from '../querybuilder/parsing';
import { changeEditorMode, getQueryWithDefaults } from '../querybuilder/state';
import { LokiQuery, QueryStats } from '../types';

import { shouldUpdateStats } from './stats';
import { LokiQueryEditorProps } from './types';

export const testIds = {
  editor: 'loki-editor',
};

export const LokiQueryEditor = React.memo<LokiQueryEditorProps>((props) => {
  const id = useId();
  const { onChange, onRunQuery, onAddQuery, data, app, queries, datasource, range: timeRange } = props;
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [queryPatternsModalOpen, setQueryPatternsModalOpen] = useState(false);
  // @ts-ignore for now, we want to always show button as primary
  const [dataIsStale, setDataIsStale] = useState(false);
  const [labelBrowserVisible, setLabelBrowserVisible] = useState(false);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const { flag: explain, setFlag: setExplain } = useFlag(lokiQueryEditorExplainKey);

  const predefinedOperations = datasource.predefinedOperations;
  const previousTimeRange = usePrevious(timeRange);

  const query = getQueryWithDefaults(props.query);
  if (config.featureToggles.lokiPredefinedOperations && !query.expr && predefinedOperations) {
    query.expr = `{} ${predefinedOperations}`;
  }
  const previousQueryExpr = usePrevious(query.expr);
  const previousQueryType = usePrevious(query.queryType);

  // This should be filled in from the defaults by now.
  const editorMode = query.editorMode!;

  const onExplainChange = (event: SyntheticEvent<HTMLInputElement>) => {
    setExplain(event.currentTarget.checked);
  };

  const onEditorModeChange = useCallback(
    (newEditorMode: QueryEditorMode) => {
      reportInteraction('grafana_loki_editor_mode_clicked', {
        newEditor: newEditorMode,
        previousEditor: query.editorMode ?? '',
        newQuery: !query.expr,
        app: app ?? '',
      });

      if (newEditorMode === QueryEditorMode.Builder) {
        const result = buildVisualQueryFromString(query.expr || '');
        // If there are errors, give user a chance to decide if they want to go to builder as that can lose some data.
        if (result.errors.length) {
          setParseModalOpen(true);
          return;
        }
      }
      changeEditorMode(query, newEditorMode, onChange);
    },
    [onChange, query, app]
  );

  useEffect(() => {
    setDataIsStale(false);
  }, [data]);

  const onChangeInternal = (query: LokiQuery) => {
    if (!isEqual(query, props.query)) {
      setDataIsStale(true);
    }
    onChange(query);
  };

  const onClickLabelBrowserButton = () => {
    reportInteraction('grafana_loki_label_browser_opened', {
      app: app,
    });

    setLabelBrowserVisible((visible) => !visible);
  };

  useEffect(() => {
    const shouldUpdate = shouldUpdateStats(
      query.expr,
      previousQueryExpr,
      timeRange,
      previousTimeRange,
      query.queryType,
      previousQueryType
    );
    if (shouldUpdate && timeRange) {
      const makeAsyncRequest = async () => {
        // overwriting the refId that is later used to cancel inflight queries with the same ID.
        const stats = await datasource.getStats({ ...query, refId: `${id}_${query.refId}` }, timeRange);
        setQueryStats(stats);
      };
      makeAsyncRequest();
    }
  }, [datasource, timeRange, previousTimeRange, query, previousQueryExpr, previousQueryType, setQueryStats, id]);

  const runQuery = (<Button
    variant="primary"
    size="md"
    onClick={onRunQuery}
    icon={data?.state === LoadingState.Loading ? 'spinner' : undefined}
    disabled={data?.state === LoadingState.Loading}
    style={{ marginLeft: '0.5em' }}
  >
    {queries && queries.length > 1 ? `Run queries` : `Run query`}
  </Button>);

  return (
    <>
      <ConfirmModal
        isOpen={parseModalOpen}
        title="Query parsing"
        body="There were errors while trying to parse the query. Continuing to visual builder may lose some parts of the query."
        confirmText="Continue"
        onConfirm={() => {
          onChange({ ...query, editorMode: QueryEditorMode.Builder });
          setParseModalOpen(false);
        }}
        onDismiss={() => setParseModalOpen(false)}
      />
      <QueryPatternsModal
        isOpen={queryPatternsModalOpen}
        onClose={() => setQueryPatternsModalOpen(false)}
        query={query}
        queries={queries}
        app={app}
        onChange={onChange}
        onAddQuery={onAddQuery}
      />
      <LabelBrowserModal
        isOpen={labelBrowserVisible}
        datasource={datasource}
        query={query}
        app={app}
        onClose={() => setLabelBrowserVisible(false)}
        onChange={onChangeInternal}
        onRunQuery={onRunQuery}
        timeRange={timeRange}
      />
      <EditorHeader>
        <Stack gap={1}>
          <Button
            aria-label={selectors.components.QueryBuilder.queryPatterns}
            variant="secondary"
            size="md"
            onClick={() => {
              setQueryPatternsModalOpen((prevValue) => !prevValue);

              const visualQuery = buildVisualQueryFromString(query.expr || '');
              reportInteraction('grafana_loki_query_patterns_opened', {
                version: 'v2',
                app: app ?? '',
                editorMode: query.editorMode,
                preSelectedOperationsCount: visualQuery.query.operations.length,
                preSelectedLabelsCount: visualQuery.query.labels.length,
              });
            }}
          >
            Template operations
          </Button>
          <Button variant="secondary" size="md" onClick={onClickLabelBrowserButton} data-testid="label-browser-button">
            Label browser
          </Button>
        </Stack>
        <QueryHeaderSwitch label="Explain query" value={explain} onChange={onExplainChange} />
        <FlexItem grow={1} />
        <QueryEditorModeToggle mode={editorMode!} onChange={onEditorModeChange} />
      </EditorHeader>
      <Space v={0.5} />
      <EditorRows>
        {editorMode === QueryEditorMode.Code && (
          <LokiQueryCodeEditor {...props} query={query} onChange={onChangeInternal} showExplain={explain} runQueryButton={runQuery} />
        )}
        {editorMode === QueryEditorMode.Builder && (
          <LokiQueryBuilderContainer
            datasource={props.datasource}
            query={query}
            onChange={onChangeInternal}
            onRunQuery={props.onRunQuery}
            showExplain={explain}
            timeRange={timeRange}
            runQueryButton={runQuery}
          />
        )}
        <QueryOptionGroup
          title=""
          collapsedInfo={[]}
          queryStats={queryStats}
        ><></></QueryOptionGroup>
      </EditorRows>
    </>
  );
});

LokiQueryEditor.displayName = 'LokiQueryEditor';
