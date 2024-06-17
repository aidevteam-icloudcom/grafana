import { css } from '@emotion/react';

import { GrafanaTheme2 } from '@grafana/data';

export function getCodeStyles(theme: GrafanaTheme2) {
  return css({
    'code, pre': {
      ...theme.typography.code,
      fontSize: theme.typography.bodySmall.fontSize,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: '4px',
    },

    code: {
      whiteSpace: 'nowrap',
      padding: '2px 5px',
      margin: '0 2px',
    },

    pre: {
      display: 'block',
      margin: `0 0 ${theme.typography.body.lineHeight}`,
      lineHeight: theme.typography.body.lineHeight,
      wordBreak: 'break-all',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      padding: '10px',

      code: {
        padding: 0,
        color: 'inherit',
        whiteSpace: 'pre-wrap',
        backgroundColor: 'transparent',
        border: 0,
      },
    },
  });
}
