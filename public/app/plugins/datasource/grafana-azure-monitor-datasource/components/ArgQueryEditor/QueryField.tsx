import { CodeEditor } from '@grafana/ui';
import React, { useCallback } from 'react';
import { AzureQueryEditorFieldProps } from '../../types';

const QueryField: React.FC<AzureQueryEditorFieldProps> = ({ query, onQueryChange }) => {
  const onChange = useCallback(
    (newQuery: string) => {
      onQueryChange({
        ...query,
        azureResourceGraph: {
          ...query.azureResourceGraph,
          query: newQuery,
        },
      });
    },
    [onQueryChange, query]
  );

  return (
    <CodeEditor
      value={query.azureResourceGraph.query}
      language="kql"
      height={200}
      width={1000}
      showMiniMap={false}
      onBlur={onChange}
      onSave={onChange}
    />
  );
};

export default QueryField;
