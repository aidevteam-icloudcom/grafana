import { useEffect, useMemo } from 'react';

import { DataQuery, DataQueryRequest, DataQueryResponse, TestDataSourceResponse } from '@grafana/data';
import { RuntimeDataSource, sceneUtils } from '@grafana/scenes';
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';
import { dispatch } from 'app/store/store';

import { stateHistoryApi } from '../../../api/stateHistoryApi';
import { DataSourceInformation } from '../../../home/Insights';

import { LIMIT_EVENTS } from './CentralAlertHistory';
import { historyResultToDataFrame } from './utils';

const historyDataSourceUid = '__history_api_ds__';
const historyDataSourcePluginId = '__history_api_ds__';

export const alertStateHistoryDatasource: DataSourceInformation = {
  type: historyDataSourcePluginId,
  uid: historyDataSourceUid,
  settings: undefined,
};

export function useRegisterHistoryRuntimeDataSource() {
  // we need to memoize the datasource so it is not registered multiple times for each render
  const ds = useMemo(() => new HistoryAPIDatasource(historyDataSourcePluginId, historyDataSourceUid), []);
  useEffect(() => {
    sceneUtils.registerRuntimeDataSource({ dataSource: ds });
  }, [ds]);
}

/**
 * This class is a runtime datasource that fetches the events from the history api.
 * The events are grouped by alert instance and then converted to a DataFrame list.
 * The DataFrame list is then grouped by time.
 * This allows us to filter the events by labels.
 * The result is a timeseries panel that shows the events for the selected time range and filtered by labels.
 */
class HistoryAPIDatasource extends RuntimeDataSource {
  constructor(pluginId: string, uid: string) {
    super(uid, pluginId);
  }

  async query(request: DataQueryRequest<DataQuery>): Promise<DataQueryResponse> {
    const from = request.range.from.unix();
    const to = request.range.to.unix();

    return {
      data: historyResultToDataFrame(await getHistory(from, to)),
    };
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({ status: 'success', message: 'Data source is working', title: 'Success' });
  }
}

export const getHistory = async (from: number, to: number) => {
  return await dispatch(
    stateHistoryApi.endpoints.getRuleHistory.initiate(
      {
        from: from,
        to: to,
        limit: LIMIT_EVENTS,
      },
      {
        forceRefetch: Boolean(getTimeSrv().getAutoRefreshInteval().interval), // force refetch in case we are using the refresh option
      }
    )
  ).unwrap();
};
