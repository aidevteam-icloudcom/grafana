import { render, screen } from '@testing-library/react';
import React from 'react';

import { selectors } from '@grafana/e2e-selectors';

import { createLokiDatasource } from '../../__mocks__/datasource';
import { LokiQuery } from '../../types';

import { EXPLAIN_LABEL_FILTER_CONTENT } from './LokiQueryBuilderExplained';
import { LokiQueryCodeEditor } from './LokiQueryCodeEditor';

const defaultQuery: LokiQuery = {
  expr: '{job="bar"}',
  refId: 'A',
};

const createDefaultProps = () => {
  const datasource = createLokiDatasource();

  const props = {
    datasource,
    onRunQuery: () => {},
    onChange: () => {},
    showExplain: false,
    setQueryStats: () => {},
  };

  return props;
};

describe('LokiQueryCodeEditor', () => {
  it('shows explain section when showExplain is true', async () => {
    const props = createDefaultProps();
    props.showExplain = true;
    props.datasource.metadataRequest = jest.fn().mockResolvedValue([]);
    render(<LokiQueryCodeEditor {...props} query={defaultQuery} />);
    const monacoEditor = await screen.findByTestId(selectors.components.ReactMonacoEditor.container);
    expect(monacoEditor).toBeInTheDocument();
    expect(screen.getByText(EXPLAIN_LABEL_FILTER_CONTENT)).toBeInTheDocument();
  });

  it('does not show explain section when showExplain is false', async () => {
    const props = createDefaultProps();
    props.datasource.metadataRequest = jest.fn().mockResolvedValue([]);
    render(<LokiQueryCodeEditor {...props} query={defaultQuery} />);
    const monacoEditorLoading = await screen.findByTestId(selectors.components.ReactMonacoEditor.container);
    expect(monacoEditorLoading).toBeInTheDocument();
    expect(screen.queryByText(EXPLAIN_LABEL_FILTER_CONTENT)).not.toBeInTheDocument();
  });
});
