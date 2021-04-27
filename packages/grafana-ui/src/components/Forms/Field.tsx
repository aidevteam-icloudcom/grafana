import React, { HTMLAttributes } from 'react';
import { Label } from './Label';
import { stylesFactory, useTheme } from '../../themes';
import { css, cx } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import { FieldValidationMessage } from './FieldValidationMessage';
import { getChildId } from '../../utils/children';

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Form input element, i.e Input or Switch */
  children: React.ReactElement;
  /** Label for the field */
  label?: React.ReactNode;
  /** Description of the field */
  description?: React.ReactNode;
  /** Indicates if field is in invalid state */
  invalid?: boolean;
  /** Indicates if field is in loading state */
  loading?: boolean;
  /** Indicates if field is disabled */
  disabled?: boolean;
  /** Indicates if field is required */
  required?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Indicates horizontal layout of the field */
  horizontal?: boolean;
  className?: string;
}

export const getFieldStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    field: css`
      display: flex;
      flex-direction: column;
      margin-bottom: ${theme.spacing.formInputMargin};
    `,
    fieldHorizontal: css`
      flex-direction: row;
      justify-content: space-between;
      flex-wrap: wrap;
    `,
    fieldValidationWrapper: css`
      margin-top: ${theme.spacing.formSpacingBase / 2}px;
    `,
    fieldValidationWrapperHorizontal: css`
      flex: 1 1 100%;
    `,
  };
});

export const Field: React.FC<FieldProps> = ({
  label,
  description,
  horizontal,
  invalid,
  loading,
  disabled,
  required,
  error,
  children,
  className,
  ...otherProps
}) => {
  const theme = useTheme();
  const styles = getFieldStyles(theme);
  const inputId = getChildId(children);

  const labelElement =
    typeof label === 'string' ? (
      <Label htmlFor={inputId} description={description}>
        {`${label}${required ? ' *' : ''}`}
      </Label>
    ) : (
      label
    );

  return (
    <div className={cx(styles.field, horizontal && styles.fieldHorizontal, className)} {...otherProps}>
      {labelElement}
      <div>
        {React.cloneElement(children, { invalid, disabled, loading })}
        {invalid && error && !horizontal && (
          <div className={styles.fieldValidationWrapper}>
            <FieldValidationMessage>{error}</FieldValidationMessage>
          </div>
        )}
      </div>

      {invalid && error && horizontal && (
        <div className={cx(styles.fieldValidationWrapper, styles.fieldValidationWrapperHorizontal)}>
          <FieldValidationMessage>{error}</FieldValidationMessage>
        </div>
      )}
    </div>
  );
};
