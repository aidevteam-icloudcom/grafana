import React from 'react';
import { css } from '@emotion/css';
import { IconButton, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

type Props = {
  onClick: () => void;
};

export const CloseButton: React.FC<Props> = ({ onClick }) => {
  const styles = useStyles2(getStyles);
  return <IconButton className={styles} name="times" onClick={onClick} />;
};

const getStyles = (theme: GrafanaTheme2) =>
  css`
    position: absolute;
    right: ${theme.spacing(0.5)};
    top: ${theme.spacing(1)};
  `;
