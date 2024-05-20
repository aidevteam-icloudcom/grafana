import { UrlQueryMap, locationUtil, urlUtil } from '@grafana/data';
import { config, getBackendSrv, isFetchError, locationService } from '@grafana/runtime';
import { StateManagerBase } from 'app/core/services/StateManagerBase';
import store, { default as localStorageStore } from 'app/core/store';
import { startMeasure, stopMeasure } from 'app/core/utils/metrics';
import { dashboardLoaderSrv } from 'app/features/dashboard/services/DashboardLoaderSrv';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import {
  DASHBOARD_FROM_LS_KEY,
  removeDashboardToFetchFromLocalStorage,
} from 'app/features/dashboard/state/initDashboard';
import { trackDashboardSceneLoaded } from 'app/features/dashboard/utils/tracking';
import { DashboardDTO, DashboardRoutes } from 'app/types';

import { PanelEditor } from '../panel-edit/PanelEditor';
import { DashboardScene } from '../scene/DashboardScene';
import { buildNewDashboardSaveModel } from '../serialization/buildNewDashboardSaveModel';
import { transformSaveModelToScene } from '../serialization/transformSaveModelToScene';

import { updateNavModel } from './utils';

export interface DashboardScenePageState {
  dashboard?: DashboardScene;
  panelEditor?: PanelEditor;
  isLoading?: boolean;
  loadError?: string;
}

export const DASHBOARD_CACHE_TTL = 500;

const LOAD_SCENE_MEASUREMENT = 'loadDashboardScene';

/** Only used by cache in loading home in DashboardPageProxy and initDashboard (Old arch), can remove this after old dashboard arch is gone */
export const HOME_DASHBOARD_CACHE_KEY = '__grafana_home_uid__';

interface DashboardCacheEntry {
  dashboard: DashboardDTO;
  ts: number;
  cacheKey: string;
}

export interface LoadDashboardOptions {
  uid: string;
  route: DashboardRoutes;
  urlFolderUid?: string;
  // A temporary approach not to clean the dashboard from local storage when navigating from Explore to Dashboard
  // We currently need it as there are two flows of fetching dashboard. The legacy one (initDashboard), uses the new one(DashboardScenePageStateManager.fetch) where the
  // removal of the dashboard from local storage is implemented. So in the old flow we wouldn't be able to early return dashboard from local storage, if we prematurely
  // removed it when prefetching the dashboard in DashboardPageProxy.
  // This property will be removed when the old flow (initDashboard) is removed.
  keepDashboardFromExploreInLocalStorage?: boolean;
}

export class DashboardScenePageStateManager extends StateManagerBase<DashboardScenePageState> {
  private cache: Record<string, DashboardScene> = {};

  // This is a simplistic, short-term cache for DashboardDTOs to avoid fetching the same dashboard multiple times across a short time span.
  private dashboardCache?: DashboardCacheEntry;

  // To eventualy replace the fetchDashboard function from Dashboard redux state management.
  // For now it's a simplistic version to support Home and Normal dashboard routes.
  public async fetchDashboard({
    uid,
    route,
    urlFolderUid,
    keepDashboardFromExploreInLocalStorage,
  }: LoadDashboardOptions): Promise<DashboardDTO | null> {
    const model = localStorageStore.getObject<DashboardDTO>(DASHBOARD_FROM_LS_KEY);

    if (model) {
      if (!keepDashboardFromExploreInLocalStorage) {
        removeDashboardToFetchFromLocalStorage();
      }
      return model;
    }

    const cacheKey = route === DashboardRoutes.Home ? HOME_DASHBOARD_CACHE_KEY : uid;
    const cachedDashboard = this.getFromCache(cacheKey);

    if (cachedDashboard) {
      return cachedDashboard;
    }

    let rsp: DashboardDTO;

    try {
      switch (route) {
        case DashboardRoutes.New:
          rsp = await buildNewDashboardSaveModel(urlFolderUid);

          break;
        case DashboardRoutes.Home:
          rsp = await getBackendSrv().get('/api/dashboards/home');

          if (rsp.redirectUri) {
            return rsp;
          }

          if (rsp?.meta) {
            rsp.meta.canSave = false;
            rsp.meta.canShare = false;
            rsp.meta.canStar = false;
          }

          break;
        case DashboardRoutes.Public: {
          return await dashboardLoaderSrv.loadDashboard('public', '', uid);
        }
        default:
          rsp = await dashboardLoaderSrv.loadDashboard('db', '', uid);

          if (route === DashboardRoutes.Embedded) {
            rsp.meta.isEmbedded = true;
          }
      }

      if (rsp.meta.url && route === DashboardRoutes.Normal) {
        const dashboardUrl = locationUtil.stripBaseFromUrl(rsp.meta.url);
        const currentPath = locationService.getLocation().pathname;

        if (dashboardUrl !== currentPath) {
          // Spread current location to persist search params used for navigation
          locationService.replace({
            ...locationService.getLocation(),
            pathname: dashboardUrl,
          });
          console.log('not correct url correcting', dashboardUrl, currentPath);
        }
      }

      // Populate nav model in global store according to the folder
      if (rsp.meta.folderUid) {
        await updateNavModel(rsp.meta.folderUid);
      }

      // Do not cache new dashboards
      this.dashboardCache = { dashboard: rsp, ts: Date.now(), cacheKey };
    } catch (e) {
      // Ignore cancelled errors
      if (isFetchError(e) && e.cancelled) {
        return null;
      }

      console.error(e);
      throw e;
    }

    return rsp;
  }

  public async loadSnapshot(slug: string) {
    try {
      const dashboard = await this.loadSnapshotScene(slug);

      this.setState({ dashboard: dashboard, isLoading: false });
    } catch (err) {
      this.setState({ isLoading: false, loadError: String(err) });
    }
  }

  private async loadSnapshotScene(slug: string): Promise<DashboardScene> {
    const rsp = await dashboardLoaderSrv.loadDashboard('snapshot', slug, '');

    if (rsp?.dashboard) {
      const scene = transformSaveModelToScene(rsp);
      return scene;
    }

    throw new Error('Snapshot not found');
  }

  public restoreDashboardStateFromLocalStorage(dashboard: DashboardScene) {
    const preservedUrlState = store.get(`grafana.dashboard.preservedUrlFiltersState[${window.name}]`);
    if (preservedUrlState) {
      const preservedUrlStateJSON = preservedUrlState ? JSON.parse(preservedUrlState) : {};

      let preservedQueryParams: UrlQueryMap = {};

      for (const [key, value] of Object.entries(preservedUrlStateJSON)) {
        // restore non-variable query params
        if (!key.startsWith('var-')) {
          preservedQueryParams[key] = value as any;
          continue;
        }
        // restore variable query params if a variable exists in the target dashboard
        if (dashboard.state.$variables?.getByName(key.replace('var-', ''))) {
          preservedQueryParams[key] = value as any;
        }
      }

      const currentQueryParams = locationService.getLocation().search;
      let nextQueryParams = currentQueryParams;
      if (currentQueryParams) {
        nextQueryParams += '&' + urlUtil.renderUrl('', preservedQueryParams).slice(1);
      } else {
        nextQueryParams = urlUtil.renderUrl('', preservedQueryParams);
      }

      const deduplicatedQueryParams = deduplicateQueryParams(nextQueryParams);

      if (deduplicatedQueryParams) {
        locationService.replace({
          search: deduplicatedQueryParams,
        });
      }
    }
  }
  public async loadDashboard(options: LoadDashboardOptions) {
    try {
      startMeasure(LOAD_SCENE_MEASUREMENT);
      const dashboard = await this.loadScene(options);
      if (!dashboard) {
        return;
      }

      if (config.featureToggles.newDashboardWithFiltersAndGroupBy && Boolean(options.uid)) {
        this.restoreDashboardStateFromLocalStorage(dashboard);
      }

      if (!(config.publicDashboardAccessToken && dashboard.state.controls?.state.hideTimeControls)) {
        dashboard.startUrlSync();
      }

      this.setState({ dashboard: dashboard, isLoading: false });
      const measure = stopMeasure(LOAD_SCENE_MEASUREMENT);
      trackDashboardSceneLoaded(dashboard, measure?.duration);
    } catch (err) {
      this.setState({ isLoading: false, loadError: String(err) });
    }
  }

  private async loadScene(options: LoadDashboardOptions): Promise<DashboardScene | null> {
    const comingFromExplore = Boolean(
      localStorageStore.getObject<DashboardDTO>(DASHBOARD_FROM_LS_KEY) &&
        options.keepDashboardFromExploreInLocalStorage === false
    );

    this.setState({ isLoading: true });

    const rsp = await this.fetchDashboard(options);

    const fromCache = this.cache[options.uid];

    // When coming from Explore, skip returnning scene from cache
    if (!comingFromExplore) {
      if (fromCache && fromCache.state.version === rsp?.dashboard.version) {
        return fromCache;
      }
    }

    if (rsp?.dashboard) {
      const scene = transformSaveModelToScene(rsp);

      // Cache scene only if not coming from Explore, we don't want to cache temporary dashboard
      if (options.uid && !comingFromExplore) {
        this.cache[options.uid] = scene;
      }

      return scene;
    }

    if (rsp?.redirectUri) {
      const newUrl = locationUtil.stripBaseFromUrl(rsp.redirectUri);
      locationService.replace(newUrl);
      return null;
    }

    throw new Error('Dashboard not found');
  }

  public getFromCache(cacheKey: string) {
    const cachedDashboard = this.dashboardCache;

    if (
      cachedDashboard &&
      cachedDashboard.cacheKey === cacheKey &&
      Date.now() - cachedDashboard?.ts < DASHBOARD_CACHE_TTL
    ) {
      return cachedDashboard.dashboard;
    }

    return null;
  }

  public clearState() {
    getDashboardSrv().setCurrent(undefined);

    this.setState({
      dashboard: undefined,
      loadError: undefined,
      isLoading: false,
      panelEditor: undefined,
    });
  }

  public setDashboardCache(cacheKey: string, dashboard: DashboardDTO) {
    this.dashboardCache = { dashboard, ts: Date.now(), cacheKey };
  }

  public clearDashboardCache() {
    this.dashboardCache = undefined;
  }
}

let stateManager: DashboardScenePageStateManager | null = null;

export function getDashboardScenePageStateManager(): DashboardScenePageStateManager {
  if (!stateManager) {
    stateManager = new DashboardScenePageStateManager({});
  }

  return stateManager;
}

function deduplicateQueryParams(queryParams: string): string {
  const seen: { [key: string]: Set<string> } = {};
  const params = new URLSearchParams(queryParams);
  // Iterate over the query params and store unique values
  params.forEach((value, key) => {
    if (!seen[key]) {
      seen[key] = new Set();
    }
    seen[key].add(value);
  });

  // Construct a new URLSearchParams object with deduplicated parameters
  const deduplicatedParams = new URLSearchParams();
  for (const key in seen) {
    seen[key].forEach((value) => {
      deduplicatedParams.append(key, value);
    });
  }

  return deduplicatedParams.toString();
}
