import React, { FC } from 'react';
import { NotificationChannelOption } from 'app/types';
import { FieldError, DeepMap, useFormContext } from 'react-hook-form';
import { Button, useStyles2 } from '@grafana/ui';
import { CollapsibleSection } from '../CollapsibleSection';
import { ActionIcon } from '../../../rules/ActionIcon';
import { OptionField } from './OptionField';
import { useControlledFieldArray } from 'app/features/alerting/unified/hooks/useControlledFieldArray';
import { getReceiverFormFieldStyles } from './styles';

interface Props {
  defaultValues?: any[];
  option: NotificationChannelOption;
  pathPrefix: string;
  errors?: Array<DeepMap<any, FieldError>>;
}

export const SubformArrayField: FC<Props> = ({ option, pathPrefix, errors, defaultValues }) => {
  const styles = useStyles2(getReceiverFormFieldStyles);
  const path = `${pathPrefix}${option.propertyName}`;
  const formAPI = useFormContext();
  const { fields, append, remove } = useControlledFieldArray({ name: path, formAPI, defaults: defaultValues });

  return (
    <div className={styles.wrapper}>
      <CollapsibleSection
        className={styles.collapsibleSection}
        label={`${option.label} (${fields.length})`}
        description={option.description}
      >
        {(fields ?? defaultValues ?? []).map((field, itemIndex) => {
          return (
            <div key={itemIndex} className={styles.wrapper}>
              <ActionIcon
                icon="trash-alt"
                tooltip="delete"
                onClick={() => remove(itemIndex)}
                className={styles.deleteIcon}
              />
              {option.subformOptions?.map((option) => (
                <OptionField
                  defaultValue={field?.[option.propertyName]}
                  key={option.propertyName}
                  option={option}
                  pathPrefix={`${path}.${itemIndex}.`}
                  error={errors?.[itemIndex]?.[option.propertyName]}
                />
              ))}
            </div>
          );
        })}
        <Button
          className={styles.addButton}
          type="button"
          variant="secondary"
          icon="plus"
          size="sm"
          onClick={() => append({ __id: String(Math.random()) })}
        >
          Add
        </Button>
      </CollapsibleSection>
    </div>
  );
};
