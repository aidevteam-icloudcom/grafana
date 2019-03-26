import _ from 'lodash';

import { RequestStream } from './RequestStream';
import { RandomWalkStream } from './RandomWalkStream';
import { StreamHandler } from './StreamHandler';
import { DataQueryResponse, DataQuery, DataQueryOptions } from '@grafana/ui';

export interface StreamingQuery extends DataQuery {
  delay: number;
}

export interface StreamingQueryOptions<T extends StreamingQuery> extends DataQueryOptions<T> {}

export default class StreamingDatasource {
  interval: any;

  supportsExplore = true;
  supportAnnotations = false;
  supportMetrics = true;

  openStreams: { [key: string]: StreamHandler<any> } = {};

  /** @ngInject */
  constructor(instanceSettings, public backendSrv, public templateSrv) {
    const safeJsonData = instanceSettings.jsonData || {};

    this.interval = safeJsonData.timeInterval;
  }

  query(options: any): Promise<DataQueryResponse> {
    const { panelId } = options;
    const { openStreams } = this;

    let stream = openStreams[panelId];
    if (!stream) {
      if (false) {
        stream = new RandomWalkStream(options, this);
      }
      stream = new RequestStream(options, this);
      openStreams[panelId] = stream;
      console.log('MAKE Stream', openStreams);
    }
    return Promise.resolve({
      data: [],
      stream,
    });
  }

  metricFindQuery(query: string, options?: any) {
    console.log('TODO metricFindQuery', query, options);
    return Promise.resolve({ data: [] });
  }

  testDatasource() {
    return new Promise((resolve, reject) => {
      resolve({
        status: 'success',
        message: 'yes!',
      });
    });
  }
}
