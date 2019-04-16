import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { Subject, Unsubscribable, PartialObserver } from 'rxjs';
import {
  guessFieldTypes,
  toSeriesData,
  PanelData,
  LoadingState,
  DataQuery,
  TimeRange,
  ScopedVars,
  DataRequestInfo,
  SeriesData,
  LegacyResponseData,
  DataQueryError,
  toLegacyResponseData,
  isSeriesData,
  DataSourceApi,
} from '@grafana/ui';

import kbn from 'app/core/utils/kbn';

/**
 * Query response may come as events. any null|missing value just means
 * that is unknown info in the request
 */
export interface PanelDataEvent extends Partial<PanelData> {
  eventId: number;
}

export interface QueryRunnerOptions {
  ds?: DataSourceApi; // if they already have the datasource, don't look it up
  datasource: string | null;
  queries: DataQuery[];
  panelId: number;
  dashboardId?: number;
  timezone?: string;
  timeRange?: TimeRange;
  widthPixels: number;
  minInterval?: string;
  maxDataPoints?: number;
  scopedVars?: ScopedVars;
  cacheTimeout?: string;
}

export class PanelQueryRunner {
  private counter = 0;
  private subject?: Subject<PanelDataEvent>;
  private includeLegacyFormats = false;

  subscribe(observer: PartialObserver<PanelDataEvent>, includeLegacyFormats = false): Unsubscribable {
    if (!this.subject) {
      this.subject = new Subject();
    }
    if (includeLegacyFormats) {
      this.includeLegacyFormats = true;
    }
    return this.subject.subscribe(observer);
  }

  async run(options: QueryRunnerOptions) {
    if (!this.subject || !this.subject.observers.length) {
      return; // Don't run if nobody cares!
    }

    const {
      queries,
      timezone,
      datasource,
      panelId,
      dashboardId,
      timeRange,
      cacheTimeout,
      widthPixels,
      maxDataPoints,
      scopedVars,
    } = options;

    const request: DataRequestInfo = {
      timezone,
      panelId,
      dashboardId,
      range: timeRange,
      rangeRaw: timeRange.raw,
      interval: '',
      intervalMs: 0,
      targets: queries,
      maxDataPoints: maxDataPoints || widthPixels,
      scopedVars: scopedVars || {},
      cacheTimeout,
      startTime: Date.now(),
    };

    if (!queries) {
      this.subject.next({
        eventId: this.counter++,
        state: LoadingState.Done,
        series: [], // Clear the data
        legacy: [],
        request,
      });
      return;
    }

    try {
      const ds = options.ds ? options.ds : await getDatasourceSrv().get(datasource, request.scopedVars);

      const minInterval = options.minInterval || ds.interval;
      const norm = kbn.calculateInterval(timeRange, widthPixels, minInterval);

      // make shallow copy of scoped vars,
      // and add built in variables interval and interval_ms
      request.scopedVars = Object.assign({}, request.scopedVars, {
        __interval: { text: norm.interval, value: norm.interval },
        __interval_ms: { text: norm.intervalMs, value: norm.intervalMs },
      });
      request.interval = norm.interval;
      request.intervalMs = norm.intervalMs;

      // Start loading spinner: TODO, only start this if >XX ms pass?
      this.subject.next({
        eventId: this.counter++,
        state: LoadingState.Loading,
        request,
      });

      const resp = await ds.query(request);
      request.endTime = Date.now();

      // Make sure the data is SeriesData[]
      let legacy: LegacyResponseData[] | undefined;
      const series = getProcessedSeriesData(resp.data);
      if (this.includeLegacyFormats) {
        legacy = resp.data.map(v => {
          if (isSeriesData(v)) {
            return toLegacyResponseData(v);
          }
          return v;
        });
      }

      // Start loading spinner
      this.subject.next({
        eventId: this.counter++,
        state: LoadingState.Done,
        request,
        series,
        legacy,
      });
    } catch (err) {
      request.endTime = Date.now();

      const error = err as DataQueryError;
      if (!error.message) {
        err.message = 'Query Error';
      }

      this.subject.next({
        eventId: this.counter++,
        state: LoadingState.Error,
        error: error,
        request,
      });
    }
  }
}

/**
 * All panels will be passed tables that have our best guess at colum type set
 *
 * This is also used by PanelChrome for snapshot support
 */
export function getProcessedSeriesData(results?: any[]): SeriesData[] {
  if (!results) {
    return [];
  }

  const series: SeriesData[] = [];
  for (const r of results) {
    if (r) {
      series.push(guessFieldTypes(toSeriesData(r)));
    }
  }
  return series;
}
