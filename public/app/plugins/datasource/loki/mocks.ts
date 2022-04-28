import { DataSourceSettings } from '@grafana/data';

import { createDatasourceSettings } from '../../../features/datasources/mocks';

import { LokiDatasource } from './datasource';
import { LokiOptions } from './types';

interface Labels {
  [label: string]: string[];
}

interface Series {
  [label: string]: string;
}

interface SeriesForSelector {
  [selector: string]: Series[];
}

export function makeMockLokiDatasource(labelsAndValues: Labels, series?: SeriesForSelector): LokiDatasource {
  const lokiLabelsAndValuesEndpointRegex = /^label\/(\w*)\/values/;
  const lokiSeriesEndpointRegex = /^series/;

  const lokiLabelsEndpoint = 'labels';
  const rangeMock = {
    start: 1560153109000,
    end: 1560163909000,
  };

  const labels = Object.keys(labelsAndValues);
  return {
    getTimeRangeParams: () => rangeMock,
    metadataRequest: (url: string, params?: { [key: string]: string }) => {
      if (url === lokiLabelsEndpoint) {
        return labels;
      } else {
        const labelsMatch = url.match(lokiLabelsAndValuesEndpointRegex);
        const seriesMatch = url.match(lokiSeriesEndpointRegex);
        if (labelsMatch) {
          return labelsAndValues[labelsMatch[1]] || [];
        } else if (seriesMatch && series && params) {
          return series[params['match[]']] || [];
        } else {
          throw new Error(`Unexpected url error, ${url}`);
        }
      }
    },
    interpolateString: (string: string) => string,
  } as any;
}

export function createDefaultConfigOptions(): DataSourceSettings<LokiOptions> {
  return createDatasourceSettings<LokiOptions>({
    maxLines: '531',
  });
}
