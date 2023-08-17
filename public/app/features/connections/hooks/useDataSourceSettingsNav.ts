import { useLocation, useParams } from 'react-router-dom';

import { NavModel, NavModelItem } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { getNavModel } from 'app/core/selectors/navModel';
import { useDataSource, useDataSourceSettings } from 'app/features/datasources/state/hooks';
import { getDataSourceLoadingNav, buildNavModel, getDataSourceNav } from 'app/features/datasources/state/navModel';
import { useGetSingle } from 'app/features/plugins/admin/state/hooks';
import { useSelector } from 'app/types';

export const useDataSourceSettingsNavOriginal = (dataSourceId: string, pageId: string | null) => {
  const { plugin, loadError, loading } = useDataSourceSettings();
  const dataSource = useDataSource(dataSourceId);
  const dsi = getDataSourceSrv()?.getInstanceSettings(dataSourceId);
  const hasAlertingEnabled = Boolean(dsi?.meta?.alerting ?? false);
  const isAlertManagerDatasource = dsi?.type === 'alertmanager';
  const alertingSupported = hasAlertingEnabled || isAlertManagerDatasource;

  const datasourcePlugin = useGetSingle(dataSource.type);
  const navIndex = useSelector((state) => state.navIndex);
  const navIndexId = pageId ? `datasource-${pageId}-${dataSourceId}` : `datasource-settings-${dataSourceId}`;
  let pageNav: NavModel = {
    node: {
      text: 'Data Source Nav Node',
    },
    main: {
      text: 'Data Source Nav Node',
    },
  };

  if (loadError) {
    const node: NavModelItem = {
      text: loadError,
      subTitle: 'Data Source Error',
      icon: 'exclamation-triangle',
    };

    pageNav = {
      node: node,
      main: node,
    };
  }

  if (loading || !plugin) {
    pageNav = getNavModel(navIndex, navIndexId, getDataSourceLoadingNav('settings'));
  }

  if (plugin) {
    pageNav = getNavModel(
      navIndex,
      navIndexId,
      getDataSourceNav(buildNavModel(dataSource, plugin), pageId || 'settings')
    );
  }

  return {
    node: pageNav.node,
    main: {
      ...pageNav.main,
      text: dataSource.name,
      dataSourcePluginName: datasourcePlugin?.name || plugin?.meta.name || '',
      active: true,
    },
    dataSourceHeader: {
      alertingSupported,
    },
  };
};

// We are extending the original useDataSourceSettingsNav in the following ways:
// - changing the URL of the nav items to point to Connections
// - setting the parent nav item
export function useDataSourceSettingsNav(pageId?: string) {
  const { uid } = useParams<{ uid: string }>();
  const location = useLocation();
  const datasource = useDataSource(uid);
  const datasourcePlugin = useGetSingle(datasource.type);
  const params = new URLSearchParams(location.search);
  const nav = useDataSourceSettingsNavOriginal(uid, pageId || params.get('page'));
  const pageNav = {
    ...nav.main,
    text: datasource.name,
    subTitle: `Type: ${datasourcePlugin?.name}`,
    children: (nav.main.children || []).map((navModelItem) => ({
      ...navModelItem,
      url: navModelItem.url?.replace('datasources/edit/', '/connections/datasources/edit/'),
    })),
  };

  return {
    navId: 'connections-datasources',
    pageNav,
    dataSourceHeader: nav.dataSourceHeader,
  };
}
