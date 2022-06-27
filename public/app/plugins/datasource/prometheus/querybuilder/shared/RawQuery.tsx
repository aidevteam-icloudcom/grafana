import { css, cx } from '@emotion/css';
import Prism, { Grammar } from 'prismjs';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data/src';
import { useTheme2 } from '@grafana/ui/src';

export interface Props {
  query: string;
  lang: {
    grammar: Grammar;
    name: string;
  };
}
export function RawQuery({ query, lang }: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const highlighted = Prism.highlight(query, lang.grammar, lang.name);

  return (
    <div
      className={cx(styles.editorField, 'prism-syntax-highlight')}
      aria-label="selector"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    editorField: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
};
