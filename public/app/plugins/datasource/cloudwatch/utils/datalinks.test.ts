import { DataQueryRequest, DataQueryResponse, dateMath } from '@grafana/data';
import { setDataSourceSrv } from '@grafana/runtime';

import { CloudWatchQuery } from '../types';

import { addDataLinksToLogsResponse } from './datalinks';

describe('addDataLinksToLogsResponse', () => {
  it('should add data links to response from log group names', async () => {
    const mockResponse: DataQueryResponse = {
      data: [
        {
          fields: [
            {
              name: '@message',
              config: {},
            },
            {
              name: '@xrayTraceId',
              config: {},
            },
          ],
          refId: 'A',
        },
      ],
    };

    const mockOptions: any = {
      targets: [
        {
          refId: 'A',
          expression: 'stats count(@message) by bin(1h)',
          logGroupNames: ['fake-log-group-one', 'fake-log-group-two'],
          region: 'us-east-1',
        },
      ],
    };

    const time = {
      from: dateMath.parse('2016-12-31 15:00:00Z', false)!,
      to: dateMath.parse('2016-12-31 16:00:00Z', false)!,
    };

    setDataSourceSrv({
      async get() {
        return {
          name: 'Xray',
        };
      },
    } as any);

    await addDataLinksToLogsResponse(
      mockResponse,
      mockOptions,
      { ...time, raw: time },
      (s) => s ?? '',
      (v) => [v] ?? [],
      (r) => r,
      'xrayUid'
    );
    expect(mockResponse).toMatchObject({
      data: [
        {
          fields: [
            {
              name: '@message',
              config: {
                links: [
                  {
                    url: "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs-insights:queryDetail=~(end~'2016-12-31T16*3a00*3a00.000Z~start~'2016-12-31T15*3a00*3a00.000Z~timeType~'ABSOLUTE~tz~'UTC~editorString~'stats*20count*28*40message*29*20by*20bin*281h*29~isLiveTail~false~source~(~'fake-log-group-one~'fake-log-group-two))",
                    title: 'View in CloudWatch console',
                  },
                ],
              },
            },
            {
              name: '@xrayTraceId',
              config: {
                links: [
                  {
                    url: '',
                    title: 'Xray',
                    internal: {
                      query: { query: '${__value.raw}', region: 'us-east-1', queryType: 'getTrace' },
                      datasourceUid: 'xrayUid',
                      datasourceName: 'Xray',
                    },
                  },
                ],
              },
            },
          ],
          refId: 'A',
        },
      ],
    });
  });

  it('should add data links to response from log groups, trimming :*', async () => {
    const mockResponse: DataQueryResponse = {
      data: [
        {
          fields: [
            {
              name: '@message',
              config: {},
            },
          ],
          refId: 'A',
        },
      ],
    };

    const mockOptions = {
      targets: [
        {
          refId: 'A',
          expression: 'stats count(@message) by bin(1h)',
          logGroups: [
            { value: 'arn:aws:logs:us-east-1:111111111111:log-group:/aws/lambda/test:*' },
            { value: 'arn:aws:logs:us-east-2:222222222222:log-group:/ecs/prometheus:*' },
          ],
          region: 'us-east-1',
        } as CloudWatchQuery,
      ],
    } as DataQueryRequest<CloudWatchQuery>;

    const time = {
      from: dateMath.parse('2016-12-31 15:00:00Z', false)!,
      to: dateMath.parse('2016-12-31 16:00:00Z', false)!,
    };

    await addDataLinksToLogsResponse(
      mockResponse,
      mockOptions,
      { ...time, raw: time },
      (s) => s ?? '',
      (v) => [v] ?? [],
      (r) => r
    );
    expect(mockResponse).toMatchObject({
      data: [
        {
          fields: [
            {
              name: '@message',
              config: {
                links: [
                  {
                    url: "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs-insights:queryDetail=~(end~'2016-12-31T16*3a00*3a00.000Z~start~'2016-12-31T15*3a00*3a00.000Z~timeType~'ABSOLUTE~tz~'UTC~editorString~'stats*20count*28*40message*29*20by*20bin*281h*29~isLiveTail~false~source~(~'arn*3aaws*3alogs*3aus-east-1*3a111111111111*3alog-group*3a*2faws*2flambda*2ftest~'arn*3aaws*3alogs*3aus-east-2*3a222222222222*3alog-group*3a*2fecs*2fprometheus))",
                    title: 'View in CloudWatch console',
                  },
                ],
              },
            },
          ],
          refId: 'A',
        },
      ],
    });
  });
});
