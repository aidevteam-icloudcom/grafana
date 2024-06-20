// Core Grafana history https://github.com/grafana/grafana/blob/v11.0.0-preview/public/app/plugins/datasource/prometheus/querycache/QueryCache.ts
import {
  DataFrame,
  DataQueryRequest,
  dateTime,
  durationToMilliseconds,
  Field,
  incrRoundDn,
  isValidDuration,
  parseDuration,
} from '@grafana/data';

import { amendTable, Table, trimTable } from '../gcopypaste/app/features/live/data/amendTimeSeries';
import { PromQuery } from '../types';

// dashboardUID + panelId + refId
// (must be stable across query changes, time range changes / interval changes / panel resizes / template variable changes)
type TargetIdent = string;

// query + template variables + interval + raw time range
// used for full target cache busting -> full range re-query
type TargetSig = string;

type TimestampMs = number;

type SupportedQueryTypes = PromQuery;

// string matching requirements defined in durationutil.ts
export const defaultPrometheusQueryOverlapWindow = '10m';

interface TargetCache {
  sig: TargetSig;
  prevTo: TimestampMs;
  frames: DataFrame[];
}

export interface CacheRequestInfo<T extends SupportedQueryTypes> {
  requests: Array<DataQueryRequest<T>>;
  targSigs: Map<TargetIdent, TargetSig>;
  shouldCache: boolean;
}

/**
 * Get field identity
 * This is the string used to uniquely identify a field within a "target"
 * @param field
 */
export const getFieldIdent = (field: Field) => `${field.type}|${field.name}|${JSON.stringify(field.labels ?? '')}`;

/**
 * NOMENCLATURE
 * Target: The request target (DataQueryRequest), i.e. a specific query reference within a panel
 * Ident: Identity: the string that is not expected to change
 * Sig: Signature: the string that is expected to change, upon which we wipe the cache fields
 */
export class QueryCache<T extends SupportedQueryTypes> {
  private overlapWindowMs: number;
  private getTargetSignature: (request: DataQueryRequest<T>, target: T) => string;

  cache = new Map<TargetIdent, TargetCache>();

  constructor(options: {
    getTargetSignature: (request: DataQueryRequest<T>, target: T) => string;
    overlapString: string;
  }) {
    const unverifiedOverlap = options.overlapString;
    if (isValidDuration(unverifiedOverlap)) {
      const duration = parseDuration(unverifiedOverlap);
      this.overlapWindowMs = durationToMilliseconds(duration);
    } else {
      const duration = parseDuration(defaultPrometheusQueryOverlapWindow);
      this.overlapWindowMs = durationToMilliseconds(duration);
    }

    this.getTargetSignature = options.getTargetSignature;
  }

  // can be used to change full range request to partial, split into multiple requests
  requestInfo(request: DataQueryRequest<T>): CacheRequestInfo<T> {
    // TODO: align from/to to interval to increase probability of hitting backend cache

    const newFrom = request.range.from.valueOf();
    const newTo = request.range.to.valueOf();

    // only cache 'now'-relative queries (that can benefit from a backfill cache)
    const shouldCache = request.rangeRaw?.to?.toString() === 'now';

    // all targets are queried together, so we check for any that causes group cache invalidation & full re-query
    let doPartialQuery = shouldCache;
    let prevTo: TimestampMs | undefined = undefined;

    // pre-compute reqTargSigs
    const reqTargSigs = new Map<TargetIdent, TargetSig>();
    request.targets.forEach((targ) => {
      let targIdent = `${request.dashboardUID}|${request.panelId}|${targ.refId}`;
      let targSig = this.getTargetSignature(request, targ); // ${request.maxDataPoints} ?
      reqTargSigs.set(targIdent, targSig);
    });

    // figure out if new query range or new target props trigger full cache invalidation & re-query
    for (const [targIdent, targSig] of reqTargSigs) {
      let cached = this.cache.get(targIdent);
      let cachedSig = cached?.sig;

      if (cachedSig !== targSig) {
        doPartialQuery = false;
      } else {
        // only do partial queries when new request range follows prior request range (possibly with overlap)
        // e.g. now-6h with refresh <= 6h
        prevTo = cached?.prevTo ?? Infinity;

        doPartialQuery = newTo > prevTo && newFrom <= prevTo;
      }

      if (!doPartialQuery) {
        break;
      }
    }

    if (doPartialQuery && prevTo) {
      // clamp to make sure we don't re-query previous 10m when newFrom is ahead of it (e.g. 5min range, 30s refresh)
      let newFromPartial = Math.max(prevTo - this.overlapWindowMs, newFrom);

      const newToDate = dateTime(newTo);
      const newFromPartialDate = dateTime(incrRoundDn(newFromPartial, request.intervalMs));

      // modify to partial query
      request = {
        ...request,
        range: {
          ...request.range,
          from: newFromPartialDate,
          to: newToDate,
        },
      };
    } else {
      reqTargSigs.forEach((targSig, targIdent) => {
        this.cache.delete(targIdent);
      });
    }

    return {
      requests: [request],
      targSigs: reqTargSigs,
      shouldCache,
    };
  }

  // should amend existing cache with new frames and return full response
  procFrames(
    request: DataQueryRequest<T>,
    requestInfo: CacheRequestInfo<T> | undefined,
    respFrames: DataFrame[]
  ): DataFrame[] {
    if (requestInfo?.shouldCache) {
      const newFrom = request.range.from.valueOf();
      const newTo = request.range.to.valueOf();

      // group frames by targets
      const respByTarget = new Map<TargetIdent, DataFrame[]>();

      respFrames.forEach((frame: DataFrame) => {
        let targIdent = `${request.dashboardUID}|${request.panelId}|${frame.refId}`;

        let frames = respByTarget.get(targIdent);

        if (!frames) {
          frames = [];
          respByTarget.set(targIdent, frames);
        }

        frames.push(frame);
      });

      let outFrames: DataFrame[] = [];

      respByTarget.forEach((respFrames, targIdent) => {
        let cachedFrames = (targIdent ? this.cache.get(targIdent)?.frames : null) ?? [];

        respFrames.forEach((respFrame: DataFrame) => {
          // skip empty frames
          if (respFrame.length === 0 || respFrame.fields.length === 0) {
            return;
          }

          // frames are identified by their second (non-time) field's name + labels
          // TODO: maybe also frame.meta.type?
          let respFrameIdent = getFieldIdent(respFrame.fields[1]);

          let cachedFrame = cachedFrames.find((cached) => getFieldIdent(cached.fields[1]) === respFrameIdent);

          if (!cachedFrame) {
            // append new unknown frames
            cachedFrames.push(respFrame);
          } else {
            // we assume that fields cannot appear/disappear and will all exist in same order

            // amend & re-cache
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            let prevTable: Table = cachedFrame.fields.map((field) => field.values) as Table;
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            let nextTable: Table = respFrame.fields.map((field) => field.values) as Table;

            let amendedTable = amendTable(prevTable, nextTable);
            if (amendedTable) {
              for (let i = 0; i < amendedTable.length; i++) {
                cachedFrame.fields[i].values = amendedTable[i];
              }
              cachedFrame.length = cachedFrame.fields[0].values.length;
            }
          }
        });

        // trim all frames to in-view range, evict those that end up with 0 length
        let nonEmptyCachedFrames: DataFrame[] = [];

        cachedFrames.forEach((frame) => {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          let table: Table = frame.fields.map((field) => field.values) as Table;

          let trimmed = trimTable(table, newFrom, newTo);

          if (trimmed[0].length > 0) {
            for (let i = 0; i < trimmed.length; i++) {
              frame.fields[i].values = trimmed[i];
            }
            nonEmptyCachedFrames.push(frame);
          }
        });

        this.cache.set(targIdent, {
          sig: requestInfo.targSigs.get(targIdent)!,
          frames: nonEmptyCachedFrames,
          prevTo: newTo,
        });

        outFrames.push(...nonEmptyCachedFrames);
      });

      // transformV2 mutates field values for heatmap de-accum, and modifies field order, so we gotta clone here, for now :(
      respFrames = outFrames.map((frame) => ({
        ...frame,
        fields: frame.fields.map((field) => ({
          ...field,
          config: {
            ...field.config, // prevents mutatative exemplars links (re)enrichment
          },
          values: field.values.slice(),
        })),
      }));
    }

    return respFrames;
  }
}
