import React, { FC } from 'react';
import { Button, Field, Input, IconButton, InputControl, useStyles2, Select } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { SilenceFormFields } from '../../types/silence-form';
import { MatcherOperator } from 'app/plugins/datasource/alertmanager/types';
import { matcherToOperator, matcherFieldToMatcher } from '../../utils/alertmanager';

interface Props {
  className?: string;
}

const MatchersField: FC<Props> = ({ className }) => {
  const styles = useStyles2(getStyles);
  const formApi = useFormContext<SilenceFormFields>();
  const {
    control,
    register,
    formState: { errors },
  } = formApi;

  const matcherFieldOptions: SelectableValue[] = [
    { label: MatcherOperator.equal, description: 'Equals', value: MatcherOperator.equal },
    { label: MatcherOperator.notEqual, description: 'Does not equal', value: MatcherOperator.notEqual },
    { label: MatcherOperator.regex, description: 'Matches regex', value: MatcherOperator.regex },
    { label: MatcherOperator.notRegex, description: 'Does not match regex', value: MatcherOperator.notRegex },
  ];

  const { fields: matchers = [], append, remove } = useFieldArray<SilenceFormFields>({ name: 'matchers' });

  return (
    <div className={cx(className, styles.wrapper)}>
      <Field label="Matching labels" required>
        <div>
          <div className={styles.matchers}>
            {matchers.map((matcher, index) => {
              return (
                <div className={styles.row} key={`${matcher.id}`}>
                  <Field
                    label="Label"
                    invalid={!!errors?.matchers?.[index]?.name}
                    error={errors?.matchers?.[index]?.name?.message}
                  >
                    <Input
                      {...register(`matchers.${index}.name` as const, {
                        required: { value: true, message: 'Required.' },
                      })}
                      defaultValue={matcher.name}
                      placeholder="label"
                    />
                  </Field>
                  <Field label={'Operator'}>
                    <InputControl
                      control={control}
                      render={({ field: { onChange, ref, ...field } }) => (
                        <Select
                          {...field}
                          className={styles.matcherOptions}
                          onChange={(value) => onChange(value?.value)}
                          options={matcherFieldOptions}
                        />
                      )}
                      defaultValue={
                        matcherFieldOptions.find(
                          (field) => field.label === matcherToOperator(matcherFieldToMatcher(matcher))
                        ) || matcherFieldOptions[0]
                      }
                      name={`matchers.${index}.operator` as const}
                      rules={{ required: { value: true, message: 'Required.' } }}
                    />
                  </Field>
                  <Field
                    label="Value"
                    invalid={!!errors?.matchers?.[index]?.value}
                    error={errors?.matchers?.[index]?.value?.message}
                  >
                    <Input
                      {...register(`matchers.${index}.value` as const, {
                        required: { value: true, message: 'Required.' },
                      })}
                      defaultValue={matcher.value}
                      placeholder="value"
                    />
                  </Field>
                  {matchers.length > 1 && (
                    <IconButton
                      className={styles.removeButton}
                      tooltip="Remove matcher"
                      name={'trash-alt'}
                      onClick={() => remove(index)}
                    >
                      Remove
                    </IconButton>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            icon="plus"
            variant="secondary"
            onClick={() => {
              const newMatcher = { name: '', value: '', operator: MatcherOperator.equal };
              append(newMatcher);
            }}
          >
            Add matcher
          </Button>
        </div>
      </Field>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      margin-top: ${theme.spacing(2)};
    `,
    row: css`
      display: flex;
      align-items: flex-start;
      flex-direction: row;
      background-color: ${theme.colors.background.secondary};
      padding: ${theme.spacing(1)} ${theme.spacing(1)} 0 ${theme.spacing(1)};
      & > * + * {
        margin-left: ${theme.spacing(2)};
      }
    `,
    removeButton: css`
      margin-left: ${theme.spacing(1)};
      margin-top: ${theme.spacing(2.5)};
    `,
    matcherOptions: css`
      min-width: 140px;
    `,
    matchers: css`
      max-width: 585px;
      margin: ${theme.spacing(1)} 0;
      padding-top: ${theme.spacing(0.5)};
    `,
  };
};

export default MatchersField;
