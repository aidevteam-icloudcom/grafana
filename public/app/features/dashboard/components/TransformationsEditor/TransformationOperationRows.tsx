import React from 'react';

import { DataFrame, DataTransformerConfig, standardTransformersRegistry } from '@grafana/data';

import { TransformationOperationRow } from './TransformationOperationRow';
import { TransformationsEditorTransformation } from './types';

interface TransformationOperationRowsProps {
  data: DataFrame[];
  configs: TransformationsEditorTransformation[];
  onRemove: (index: number) => void;
  onChange: (index: number, config: DataTransformerConfig) => void;
}

export const TransformationOperationRows = ({
  data,
  onChange,
  onRemove,
  configs,
}: TransformationOperationRowsProps) => {
  return (
    <>
      {configs.map((t, i) => {
        const uiConfig = standardTransformersRegistry.getIfExists(t.transformation.id);
        // JEV: what is the standardTransformersRegistry?
        if (!uiConfig) {
          return null;
        }

        return (
          <TransformationOperationRow
            index={i}
            id={`${t.id}`}
            key={`${t.id}`}
            data={data}
            configs={configs}
            uiConfig={uiConfig}
            onRemove={onRemove}
            onChange={onChange}
          />
        );
      })}
    </>
  );
};
