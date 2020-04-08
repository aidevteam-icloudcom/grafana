import React from 'react';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { selectThemeVariant, stylesFactory, useTheme } from '../../themes';
import Forms from '../Forms';
import { Icon } from '../Icon/Icon';

interface FieldConfigItemHeaderTitleProps {
  title: string;
  description?: string;
  transparent?: boolean;
  onRemove: () => void;
}

export const FieldConfigItemHeaderTitle: React.FC<FieldConfigItemHeaderTitleProps> = ({
  title,
  description,
  onRemove,
  children,
  transparent,
}) => {
  const theme = useTheme();
  const styles = getFieldConfigItemHeaderTitleStyles(theme);
  return (
    <div className={!transparent ? styles.headerWrapper : ''}>
      <div className={styles.header}>
        <Forms.Label description={description}>{title}</Forms.Label>
        <div className={styles.remove} onClick={() => onRemove()} aria-label="FieldConfigItemHeaderTitle remove button">
          <Icon name="trash-alt" />
        </div>
      </div>
      {children}
    </div>
  );
};

const getFieldConfigItemHeaderTitleStyles = stylesFactory((theme: GrafanaTheme) => {
  const headerBg = selectThemeVariant(
    {
      light: theme.colors.white,
      dark: theme.colors.dark1,
    },
    theme.type
  );

  return {
    headerWrapper: css`
      background: ${headerBg};
      padding: ${theme.spacing.xs} 0;
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      padding: ${theme.spacing.xs} ${theme.spacing.xs} 0 ${theme.spacing.xs};
    `,
    remove: css`
      flex-grow: 0;
      flex-shrink: 0;
      cursor: pointer;
      color: ${theme.colors.red88};
    `,
  };
});
