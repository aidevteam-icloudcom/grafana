import { css } from '@emotion/css';
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useAsync } from 'react-use';

import { DataQuery, getDefaultTimeRange, GrafanaTheme2 } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import {
  Field,
  LoadingPlaceholder,
  Alert,
  Button,
  HorizontalGroup,
  Icon,
  FieldValidationMessage,
  useStyles2,
} from '@grafana/ui';

import { buildQueryTransaction } from '../../../core/utils/explore';
import { ExploreId } from '../../../types';
import { runRequest } from '../../query/state/runRequest';

interface Props {
  dsUid?: string;
  name: string;
  invalid?: boolean;
  error?: string;
}

function getStyle(theme: GrafanaTheme2) {
  return {
    valid: css`
      color: ${theme.colors.success.text};
    `,
  };
}

export const QueryEditorField = ({ dsUid, invalid, error, name }: Props) => {
  const [isValidQuery, setIsValidQuery] = useState<boolean | undefined>(undefined);

  const style = useStyles2(getStyle);

  const {
    value: datasource,
    loading: dsLoading,
    error: dsError,
  } = useAsync(async () => {
    if (!dsUid) {
      return;
    }
    return getDataSourceSrv().get(dsUid);
  }, [dsUid]);

  const QueryEditor = datasource?.components?.QueryEditor;

  const handleValidation = (value: DataQuery) => {
    const transaction = buildQueryTransaction(
      ExploreId.left,
      [{ ...value, refId: 'something' }],
      {},
      getDefaultTimeRange(),
      false,
      'utc'
    );

    if (datasource) {
      runRequest(datasource, transaction.request).subscribe((panelData) => {
        if (!panelData || panelData.state === 'Error') {
          setIsValidQuery(false);
        } else if (panelData.state === 'Done') {
          setIsValidQuery(true);
        } else {
          setIsValidQuery(undefined);
        }
      });
    }
  };

  return (
    <Field label="Query" invalid={invalid} error={error}>
      <Controller
        name={name}
        rules={{
          validate: {
            hasQueryEditor: () =>
              QueryEditor !== undefined || 'The selected target data source must export a query editor.',
          },
        }}
        render={({ field: { value, onChange } }) => {
          if (dsLoading) {
            return <LoadingPlaceholder text="Loading query editor..." />;
          }
          if (dsError) {
            return <Alert title="Error loading data source">The selected data source could not be loaded.</Alert>;
          }
          if (!datasource) {
            return (
              <Alert title="No data source selected" severity="info">
                Please select a target data source first.
              </Alert>
            );
          }
          if (!QueryEditor) {
            return <Alert title="Data source does not export a query editor."></Alert>;
          }
          return (
            <>
              <QueryEditor
                onRunQuery={() => handleValidation(value)}
                onChange={(value) => {
                  setIsValidQuery(undefined);
                  onChange(value);
                }}
                datasource={datasource}
                query={value}
              />
              <HorizontalGroup justify="flex-end">
                {isValidQuery ? (
                  <div className={style.valid}>
                    <Icon name="check" /> This query is valid.
                  </div>
                ) : isValidQuery === false ? (
                  <FieldValidationMessage>This query is not valid.</FieldValidationMessage>
                ) : null}
                <Button variant="primary" icon={'check'} type="button" onClick={() => handleValidation(value)}>
                  Validate query
                </Button>
              </HorizontalGroup>
            </>
          );
        }}
      />
    </Field>
  );
};
