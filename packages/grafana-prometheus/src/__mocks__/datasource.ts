import { CoreApp, DataQueryRequest, dateTime, rangeUtil, TimeRange } from '@grafana/data';

import { PromQuery } from '../types';

export function createDataRequest(
  targets: PromQuery[],
  overrides?: Partial<DataQueryRequest>
): DataQueryRequest<PromQuery> {
  const defaults: DataQueryRequest<PromQuery> = {
    intervalMs: 15000,
    requestId: 'createDataRequest',
    startTime: 0,
    timezone: 'browser',
    app: CoreApp.Dashboard,
    targets: targets.map((t, i) => ({
      instant: false,
      start: dateTime().subtract(5, 'minutes'),
      end: dateTime(),
      ...t,
    })),
    range: {
      from: dateTime(),
      to: dateTime(),
      raw: {
        from: '',
        to: '',
      },
    },
    interval: '15s',
    scopedVars: {},
  };

  return Object.assign(defaults, overrides || {}) as DataQueryRequest<PromQuery>;
}

export function createDefaultPromResponse() {
  return {
    data: {
      data: {
        result: [
          {
            metric: {
              __name__: 'test_metric',
            },
            values: [[1568369640, 1]],
          },
        ],
        resultType: 'matrix',
      },
    },
  };
}

export function createAnnotationResponse() {
  const response = {
    data: {
      results: {
        X: {
          frames: [
            {
              schema: {
                name: 'bar',
                refId: 'X',
                fields: [
                  {
                    name: 'Time',
                    type: 'time',
                    typeInfo: {
                      frame: 'time.Time',
                    },
                  },
                  {
                    name: 'Value',
                    type: 'number',
                    typeInfo: {
                      frame: 'float64',
                    },
                    labels: {
                      __name__: 'ALERTS',
                      alertname: 'InstanceDown',
                      alertstate: 'firing',
                      instance: 'testinstance',
                      job: 'testjob',
                    },
                  },
                ],
              },
              data: {
                values: [[123], [456]],
              },
            },
          ],
        },
      },
    },
  };

  return { ...response };
}

export function createEmptyAnnotationResponse() {
  const response = {
    data: {
      results: {
        X: {
          frames: [
            {
              schema: {
                name: 'bar',
                refId: 'X',
                fields: [],
              },
              data: {
                values: [],
              },
            },
          ],
        },
      },
    },
  };

  return { ...response };
}

export function getMockTimeRange(range = '6h'): TimeRange {
  return rangeUtil.convertRawToRange({
    from: `now-${range}`,
    to: 'now',
  });
}

export function fetchMockCalledWith(fetchMock: ReturnType<typeof jest.fn>): PromQuery[] {
  return fetchMock.mock.calls[0][0].data.queries ?? [];
}
