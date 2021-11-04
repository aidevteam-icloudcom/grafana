import React from 'react';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { useLocation } from 'react-router-dom';
import { CatalogPlugin, PluginListDisplayMode } from '../types';
import { PluginListItem } from './PluginListItem';

interface Props {
  plugins: CatalogPlugin[];
  displayMode: PluginListDisplayMode;
}

export const PluginList = ({ plugins, displayMode }: Props) => {
  const isList = displayMode === PluginListDisplayMode.List;
  const styles = useStyles2(getStyles);
  const location = useLocation();

  return (
    <div className={cx(styles.container, { [styles.list]: isList })} data-testid="plugin-list">
      {plugins.map((plugin) => (
        <PluginListItem key={plugin.id} plugin={plugin} pathName={location.pathname} displayMode={displayMode} />
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
      gap: ${theme.spacing(3)};
    `,
    list: css`
      grid-template-columns: 1fr;
    `,
  };
};
