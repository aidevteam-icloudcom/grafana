import React, { FC } from 'react';
import { Tooltip, useStyles } from '@grafana/ui';
import { cx } from 'emotion';
import { DBIconProps, DBIconMap } from './DBIcon.types';
import { getStyles } from './DBIcon.styles';
import { Edit, Delete, See, Restore, Backup } from './assets';

const Icons: DBIconMap = {
  edit: Edit,
  delete: Delete,
  see: See,
  restore: Restore,
  backup: Backup,
};

export const DBIcon: FC<DBIconProps> = ({ type, size, tooltipText, disabled, ...rest }) => {
  if (!Icons[type]) {
    return null;
  }
  const styles = useStyles(getStyles);
  const Icon = Icons[type];
  const IconEl = (
    <span className={cx({ [styles.disabled]: disabled })}>
      <Icon size={size} {...rest} />
    </span>
  );

  return tooltipText ? (
    <Tooltip placement="top" content={tooltipText}>
      {IconEl}
    </Tooltip>
  ) : (
    <>{IconEl}</>
  );
};
