import React, { useCallback } from 'react';
import { Button, Select, Input, HorizontalGroup, VerticalGroup, InlineLabel } from '@grafana/ui';

import { MultipleFields } from '../Field';
import { findOption, MetricsQueryEditorFieldProps, Option } from '../common';
import { AzureMetricDimension } from '../../types';

interface DimensionFieldsProps extends MetricsQueryEditorFieldProps {
  dimensionOptions: Option[];
}

const DimensionFields: React.FC<DimensionFieldsProps> = ({ query, dimensionOptions, onChange }) => {
  const addFilter = useCallback(() => {
    onChange('dimensionFilters', [
      ...query.azureMonitor.dimensionFilters,
      {
        dimension: '',
        operator: 'eq',
        filter: '',
      },
    ]);
  }, [query.azureMonitor.dimensionFilters]);

  const removeFilter = (index: number) => {
    const newFilters = [...query.azureMonitor.dimensionFilters];
    newFilters.splice(index, 1);
    onChange('dimensionFilters', newFilters);
  };

  const onFieldChange = <Key extends keyof AzureMetricDimension>(
    filterIndex: number,
    fieldName: Key,
    value: AzureMetricDimension[Key]
  ) => {
    const newFilters = [...query.azureMonitor.dimensionFilters];
    const newFilter = newFilters[filterIndex];
    newFilter[fieldName] = value;
    onChange('dimensionFilters', newFilters);
  };

  const onFilterInputChange = (index: number, ev: React.FormEvent) => {
    if (ev.target instanceof HTMLInputElement) {
      onFieldChange(index, 'filter', ev.target.value);
    }
  };

  return (
    <MultipleFields label="Dimension" labelWidth={16}>
      <VerticalGroup spacing="xs">
        {query.azureMonitor.dimensionFilters.map((filter, index) => (
          <HorizontalGroup key={index} spacing="xs">
            <Select
              placeholder="Field"
              value={findOption(dimensionOptions, filter.dimension)}
              options={dimensionOptions}
              onChange={(v) => onFieldChange(index, 'dimension', v.value ?? '')}
            />
            <InlineLabel aria-label="equals">==</InlineLabel>
            <Input placeholder="" value={filter.filter} onChange={(ev) => onFilterInputChange(index, ev)} />
            <Button
              variant="secondary"
              size="md"
              icon="trash-alt"
              aria-label="Remove"
              onClick={() => removeFilter(index)}
            ></Button>
          </HorizontalGroup>
        ))}

        <Button variant="secondary" size="md" onClick={addFilter}>
          Add new dimension
        </Button>
      </VerticalGroup>
    </MultipleFields>
  );
};

export default DimensionFields;
