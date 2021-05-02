import React, { FC, useState } from 'react';
import { NotificationChannelOption } from 'app/types';
import { FieldError, DeepMap, useFormContext } from 'react-hook-form';
import { OptionField } from './OptionField';
import { Button, useStyles2 } from '@grafana/ui';
import { ActionIcon } from '../../../rules/ActionIcon';
import { getReceiverFormFieldStyles } from './styles';

interface Props {
  defaultValue: any;
  option: NotificationChannelOption;
  pathPrefix: string;
  errors?: DeepMap<any, FieldError>;
}

export const SubformField: FC<Props> = ({ option, pathPrefix, errors, defaultValue }) => {
  const styles = useStyles2(getReceiverFormFieldStyles);
  const name = `${pathPrefix}${option.propertyName}`;
  const { watch } = useFormContext();
  const _watchValue = watch(name);
  const value = _watchValue === undefined ? defaultValue : _watchValue;

  const [show, setShow] = useState(!!value);

  return (
    <div className={styles.wrapper}>
      <h6>{option.label}</h6>
      {option.description && <p className={styles.description}>{option.description}</p>}
      {show && (
        <>
          <ActionIcon icon="trash-alt" tooltip="delete" onClick={() => setShow(false)} className={styles.deleteIcon} />
          {(option.subformOptions ?? []).map((subOption) => {
            return (
              <OptionField
                defaultValue={defaultValue?.[subOption.propertyName]}
                key={subOption.propertyName}
                option={subOption}
                pathPrefix={`${name}.`}
                error={errors?.[subOption.propertyName]}
              />
            );
          })}
        </>
      )}
      {!value && (
        <Button
          className={styles.addButton}
          type="button"
          variant="secondary"
          icon="plus"
          size="sm"
          onClick={() => setShow(true)}
        >
          Add
        </Button>
      )}
    </div>
  );
};
