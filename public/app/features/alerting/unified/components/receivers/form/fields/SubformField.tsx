import React, { FC } from 'react';
import { NotificationChannelOption } from 'app/types';
import { FieldError, DeepMap } from 'react-hook-form';
import { OptionField } from './OptionField';
import { GrafanaThemeV2 } from '@grafana/data';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { CollapsibleSection } from '../CollapsibleSection';

interface Props {
  defaultValue: any;
  option: NotificationChannelOption;
  pathPrefix: string;
  errors?: DeepMap<any, FieldError>;
}

export const SubformField: FC<Props> = ({ option, pathPrefix, errors, defaultValue }) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.wrapper}>
      <CollapsibleSection className={styles.collapsibleSection} label={option.label} description={option.description}>
        {(option.subformOptions ?? []).map((subOption) => {
          return (
            <OptionField
              defaultValue={defaultValue?.[option.propertyName]}
              key={subOption.propertyName}
              option={subOption}
              pathPrefix={`${pathPrefix}${option.propertyName}.`}
              error={errors?.[subOption.propertyName]}
            />
          );
        })}
      </CollapsibleSection>
    </div>
  );
};

const getStyles = (theme: GrafanaThemeV2) => ({
  collapsibleSection: css`
    margin: 0;
    padding: 0;
  `,
  wrapper: css`
    margin: ${theme.spacing(2, 0)};
    padding: ${theme.spacing(1)};
    border: solid 1px ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius(1)};
  `,
});
