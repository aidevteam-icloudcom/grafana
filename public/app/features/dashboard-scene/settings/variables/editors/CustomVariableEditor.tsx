import React, { FormEvent } from 'react';

import { CustomVariable } from '@grafana/scenes';

import { CustomVariableForm } from '../components/CustomVariableForm';

interface CustomVariableEditorProps {
  variable: CustomVariable;
  onRunQuery: () => void;
}

export function CustomVariableEditor({ variable, onRunQuery }: CustomVariableEditorProps) {
  const { query, isMulti, allValue, includeAll } = variable.useState();

  const onMultiChange = (event: FormEvent<HTMLInputElement>) => {
    variable.setState({ isMulti: event.currentTarget.checked });
  };
  const onIncludeAllChange = (event: FormEvent<HTMLInputElement>) => {
    variable.setState({ includeAll: event.currentTarget.checked });
  };
  const onQueryChange = (event: FormEvent<HTMLTextAreaElement>) => {
    variable.setState({ query: event.currentTarget.value });
    onRunQuery();
  };
  const onAllValueChange = (event: FormEvent<HTMLInputElement>) => {
    variable.setState({ allValue: event.currentTarget.value });
  };

  return (
    <CustomVariableForm
      query={query ?? ''}
      multi={!!isMulti}
      allValue={allValue ?? ''}
      includeAll={!!includeAll}
      onMultiChange={onMultiChange}
      onIncludeAllChange={onIncludeAllChange}
      onQueryChange={onQueryChange}
      onAllValueChange={onAllValueChange}
    />
  );
}
