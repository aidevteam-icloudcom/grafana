import 'core-js';
import 'regenerator-runtime/runtime';
import 'symbol-observable';

import 'file-saver';
import 'jquery';
import 'whatwg-fetch'; // fetch polyfill needed for PhantomJs rendering
import './polyfills/old-mediaquerylist'; // Safari < 14 does not have mql.addEventListener()

import 'app/features/all';

import _, { merge } from 'lodash'; // eslint-disable-line lodash/import-scope

import {
  locationUtil,
  monacoLanguageRegistry,
  setLocale,
  setTimeZoneResolver,
  setWeekStart,
  standardEditorsRegistry,
  standardFieldConfigEditorRegistry,
  standardTransformersRegistry,
} from '@grafana/data';
import {
  locationService,
  registerEchoBackend,
  setBackendSrv,
  setDataSourceSrv,
  setEchoSrv,
  setLocationSrv,
  setQueryRunnerFactory,
} from '@grafana/runtime';
import { setPanelDataErrorView } from '@grafana/runtime/src/components/PanelDataErrorView';
import { setPanelRenderer } from '@grafana/runtime/src/components/PanelRenderer';
import { getScrollbarWidth } from '@grafana/ui';
import config, { Settings } from 'app/core/config';
import { arrayMove } from 'app/core/utils/arrayMove';
import { getStandardTransformers } from 'app/features/transformers/standardTransformers';

import getDefaultMonacoLanguages from '../lib/monaco-languages';

import { AppChromeService } from './core/components/AppChrome/AppChromeService';
import { getAllOptionEditors, getAllStandardFieldConfigs } from './core/components/OptionsUI/registry';
import { GrafanaContextType } from './core/context/GrafanaContext';
import { interceptLinkClicks } from './core/navigation/patch/interceptLinkClicks';
import { ModalManager } from './core/services/ModalManager';
import { backendSrv } from './core/services/backend_srv';
import { contextSrv } from './core/services/context_srv';
import { Echo } from './core/services/echo/Echo';
import { reportPerformance } from './core/services/echo/EchoSrv';
import { PerformanceBackend } from './core/services/echo/backends/PerformanceBackend';
import { ApplicationInsightsBackend } from './core/services/echo/backends/analytics/ApplicationInsightsBackend';
import { GAEchoBackend } from './core/services/echo/backends/analytics/GABackend';
import { RudderstackBackend } from './core/services/echo/backends/analytics/RudderstackBackend';
import { GrafanaJavascriptAgentBackend } from './core/services/echo/backends/grafana-javascript-agent/GrafanaJavascriptAgentBackend';
import { SentryEchoBackend } from './core/services/echo/backends/sentry/SentryBackend';
import { initDevFeatures } from './dev';
import { getTimeSrv } from './features/dashboard/services/TimeSrv';
import { PanelDataErrorView } from './features/panel/components/PanelDataErrorView';
import { PanelRenderer } from './features/panel/components/PanelRenderer';
import { DatasourceSrv } from './features/plugins/datasource_srv';
import { preloadPlugins } from './features/plugins/pluginPreloader';
import { QueryRunner } from './features/query/state/QueryRunner';
import { initWindowRuntime } from './features/runtime/init';
import { variableAdapters } from './features/variables/adapters';
import { createAdHocVariableAdapter } from './features/variables/adhoc/adapter';
import { createConstantVariableAdapter } from './features/variables/constant/adapter';
import { createCustomVariableAdapter } from './features/variables/custom/adapter';
import { createDataSourceVariableAdapter } from './features/variables/datasource/adapter';
import { getVariablesUrlParams } from './features/variables/getAllVariableValuesForUrl';
import { createIntervalVariableAdapter } from './features/variables/interval/adapter';
import { setVariableQueryRunner, VariableQueryRunner } from './features/variables/query/VariableQueryRunner';
import { createQueryVariableAdapter } from './features/variables/query/adapter';
import { createSystemVariableAdapter } from './features/variables/system/adapter';
import { createTextBoxVariableAdapter } from './features/variables/textbox/adapter';
import { configureStore } from './store/configureStore';

// add move to lodash for backward compatabilty with plugins
// @ts-ignore
_.move = arrayMove;

// import symlinked extensions
const extensionsIndex = require.context('.', true, /extensions\/index.ts/);
const extensionsExports = extensionsIndex.keys().map((key) => {
  return extensionsIndex(key);
});

if (process.env.NODE_ENV === 'development') {
  initDevFeatures();
}

export class GrafanaApp {
  context!: GrafanaContextType;

  async init() {
    try {
      backendSrv.setGrafanaPrefix(true);
      setBackendSrv(backendSrv);
      let settings: Settings = await backendSrv.get('/api/frontend/settings');
      // merge(config, settings, config);
      config.panels = settings.panels;
      config.datasources = settings.datasources;
      config.defaultDatasource = settings.defaultDatasource;
      console.log('config', config);

      initEchoSrv();
      addClassIfNoOverlayScrollbar();
      setLocale(config.bootData.user.locale);
      setWeekStart(config.bootData.user.weekStart);
      setPanelRenderer(PanelRenderer);
      setPanelDataErrorView(PanelDataErrorView);
      setLocationSrv(locationService);
      setTimeZoneResolver(() => config.bootData.user.timezone);
      // Important that extension reducers are initialized before store
      addExtensionReducers();
      configureStore();
      initExtensions();

      standardEditorsRegistry.setInit(getAllOptionEditors);
      standardFieldConfigEditorRegistry.setInit(getAllStandardFieldConfigs);
      standardTransformersRegistry.setInit(getStandardTransformers);
      variableAdapters.setInit(() => [
        createQueryVariableAdapter(),
        createCustomVariableAdapter(),
        createTextBoxVariableAdapter(),
        createConstantVariableAdapter(),
        createDataSourceVariableAdapter(),
        createIntervalVariableAdapter(),
        createAdHocVariableAdapter(),
        createSystemVariableAdapter(),
      ]);
      monacoLanguageRegistry.setInit(getDefaultMonacoLanguages);

      setQueryRunnerFactory(() => new QueryRunner());
      setVariableQueryRunner(new VariableQueryRunner());

      locationUtil.initialize({
        config,
        getTimeRangeForUrl: getTimeSrv().timeRangeForUrl,
        getVariablesUrlParams: getVariablesUrlParams,
      });

      // intercept anchor clicks and forward it to custom history instead of relying on browser's history
      document.addEventListener('click', interceptLinkClicks);

      // Init DataSourceSrv
      const dataSourceSrv = new DatasourceSrv();
      dataSourceSrv.init(config.datasources, config.defaultDatasource);
      console.log('config.datasources, config.defaultDatasource', config.datasources, config.defaultDatasource);
      setDataSourceSrv(dataSourceSrv);
      initWindowRuntime();

      // init modal manager
      const modalManager = new ModalManager();
      modalManager.init();

      // Preload selected app plugins
      await preloadPlugins(config.pluginsToPreload);

      this.context = {
        backend: backendSrv,
        location: locationService,
        chrome: new AppChromeService(),
        config,
      };

      console.log('this.context', this.context);

      // ReactDOM.render(
      //   React.createElement(AppWrapper, {
      //     app: this,
      //   }),
      //   document.getElementById('reactRoot')
      // );
    } catch (error) {
      console.error('Failed to start Grafana', error);
      window.__grafana_load_failed();
    }
  }
}

function addExtensionReducers() {
  if (extensionsExports.length > 0) {
    extensionsExports[0].addExtensionReducers();
  }
}

function initExtensions() {
  if (extensionsExports.length > 0) {
    extensionsExports[0].init();
  }
}

function initEchoSrv() {
  setEchoSrv(new Echo({ debug: process.env.NODE_ENV === 'development' }));

  window.addEventListener('load', (e) => {
    const loadMetricName = 'frontend_boot_load_time_seconds';
    // Metrics below are marked in public/views/index-template.html
    const jsLoadMetricName = 'frontend_boot_js_done_time_seconds';
    const cssLoadMetricName = 'frontend_boot_css_time_seconds';

    if (performance) {
      performance.mark(loadMetricName);
      reportMetricPerformanceMark('first-paint', 'frontend_boot_', '_time_seconds');
      reportMetricPerformanceMark('first-contentful-paint', 'frontend_boot_', '_time_seconds');
      reportMetricPerformanceMark(loadMetricName);
      reportMetricPerformanceMark(jsLoadMetricName);
      reportMetricPerformanceMark(cssLoadMetricName);
    }
  });

  if (contextSrv.user.orgRole !== '') {
    registerEchoBackend(new PerformanceBackend({}));
  }

  if (config.sentry.enabled) {
    registerEchoBackend(
      new SentryEchoBackend({
        ...config.sentry,
        user: config.bootData.user,
        buildInfo: config.buildInfo,
      })
    );
  }
  if (config.grafanaJavascriptAgent.enabled) {
    registerEchoBackend(
      new GrafanaJavascriptAgentBackend({
        ...config.grafanaJavascriptAgent,
        app: {
          version: config.buildInfo.version,
          environment: config.buildInfo.env,
        },
        buildInfo: config.buildInfo,
        user: {
          id: String(config.bootData.user?.id),
          email: config.bootData.user?.email,
        },
      })
    );
  }

  if (config.googleAnalyticsId) {
    registerEchoBackend(
      new GAEchoBackend({
        googleAnalyticsId: config.googleAnalyticsId,
      })
    );
  }

  if (config.rudderstackWriteKey && config.rudderstackDataPlaneUrl) {
    registerEchoBackend(
      new RudderstackBackend({
        writeKey: config.rudderstackWriteKey,
        dataPlaneUrl: config.rudderstackDataPlaneUrl,
        user: config.bootData.user,
        sdkUrl: config.rudderstackSdkUrl,
        configUrl: config.rudderstackConfigUrl,
      })
    );
  }

  if (config.applicationInsightsConnectionString) {
    registerEchoBackend(
      new ApplicationInsightsBackend({
        connectionString: config.applicationInsightsConnectionString,
        endpointUrl: config.applicationInsightsEndpointUrl,
      })
    );
  }
}

function addClassIfNoOverlayScrollbar() {
  if (getScrollbarWidth() > 0) {
    document.body.classList.add('no-overlay-scrollbar');
  }
}

/**
 * Report when a metric of a given name was marked during the document lifecycle. Works for markers with no duration,
 * like PerformanceMark or PerformancePaintTiming (e.g. created with performance.mark, or first-contentful-paint)
 */
function reportMetricPerformanceMark(metricName: string, prefix = '', suffix = ''): void {
  const metric = _.first(performance.getEntriesByName(metricName));
  if (metric) {
    const metricName = metric.name.replace(/-/g, '_');
    reportPerformance(`${prefix}${metricName}${suffix}`, Math.round(metric.startTime) / 1000);
  }
}

export default new GrafanaApp();
