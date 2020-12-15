import { AppEvents } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { appEvents } from 'app/core/core';
import { updateLocation } from 'app/core/actions';
import store from 'app/core/store';
import {
  notificationChannelLoaded,
  loadAlertRules,
  loadedAlertRules,
  setNotificationChannels,
  setUiState,
  ALERT_DEFINITION_UI_STATE_STORAGE_KEY,
  updateAlertDefinition,
  setQueryOptions,
} from './reducers';
import { AlertDefinition, AlertDefinitionUiState, AlertRuleDTO, NotifierDTO, ThunkResult } from 'app/types';
import { QueryGroupOptions } from '../../query/components/QueryGroupOptions';

export function getAlertRulesAsync(options: { state: string }): ThunkResult<void> {
  return async dispatch => {
    dispatch(loadAlertRules());
    const rules: AlertRuleDTO[] = await getBackendSrv().get('/api/alerts', options);
    dispatch(loadedAlertRules(rules));
  };
}

export function togglePauseAlertRule(id: number, options: { paused: boolean }): ThunkResult<void> {
  return async (dispatch, getState) => {
    await getBackendSrv().post(`/api/alerts/${id}/pause`, options);
    const stateFilter = getState().location.query.state || 'all';
    dispatch(getAlertRulesAsync({ state: stateFilter.toString() }));
  };
}

export function createNotificationChannel(data: any): ThunkResult<void> {
  return async dispatch => {
    try {
      await getBackendSrv().post(`/api/alert-notifications`, data);
      appEvents.emit(AppEvents.alertSuccess, ['Notification created']);
      dispatch(updateLocation({ path: 'alerting/notifications' }));
    } catch (error) {
      appEvents.emit(AppEvents.alertError, [error.data.error]);
    }
  };
}

export function updateNotificationChannel(data: any): ThunkResult<void> {
  return async dispatch => {
    try {
      await getBackendSrv().put(`/api/alert-notifications/${data.id}`, data);
      appEvents.emit(AppEvents.alertSuccess, ['Notification updated']);
      dispatch(updateLocation({ path: 'alerting/notifications' }));
    } catch (error) {
      appEvents.emit(AppEvents.alertError, [error.data.error]);
    }
  };
}

export function testNotificationChannel(data: any): ThunkResult<void> {
  return async (dispatch, getState) => {
    const channel = getState().notificationChannel.notificationChannel;
    await getBackendSrv().post('/api/alert-notifications/test', { id: channel.id, ...data });
  };
}

export function loadNotificationTypes(): ThunkResult<void> {
  return async dispatch => {
    const alertNotifiers: NotifierDTO[] = await getBackendSrv().get(`/api/alert-notifiers`);

    const notificationTypes = alertNotifiers.sort((o1, o2) => {
      if (o1.name > o2.name) {
        return 1;
      }
      return -1;
    });

    dispatch(setNotificationChannels(notificationTypes));
  };
}

export function loadNotificationChannel(id: number): ThunkResult<void> {
  return async dispatch => {
    await dispatch(loadNotificationTypes());
    const notificationChannel = await getBackendSrv().get(`/api/alert-notifications/${id}`);
    dispatch(notificationChannelLoaded(notificationChannel));
  };
}

export function createAlertDefinition(): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const queryOptions = getStore().alertDefinition.queryOptions;
    const alertDefinition: AlertDefinition = {
      ...getStore().alertDefinition.alertDefinition,
      condition: {
        ref: 'A',
        queriesAndExpressions: queryOptions.queries.map(query => ({
          model: {
            expression: query.expr,
            type: query.queryType,
            datasource: queryOptions.dataSource.name,
            datasourceId: queryOptions.dataSource.uid,
          },
          refId: query.refId,
          relativeTimeRange: {
            From: 500,
            To: 0,
          },
        })),
      },
    };
    await getBackendSrv().post(`/api/alert-definitions`, alertDefinition);
    appEvents.emit(AppEvents.alertSuccess, ['Alert definition created']);
    dispatch(updateLocation({ path: 'alerting/list' }));
  };
}

export function updateAlertDefinitionUiState(uiState: Partial<AlertDefinitionUiState>): ThunkResult<void> {
  return (dispatch, getStore) => {
    const nextState = { ...getStore().alertDefinition.uiState, ...uiState };
    dispatch(setUiState(nextState));

    try {
      store.setObject(ALERT_DEFINITION_UI_STATE_STORAGE_KEY, nextState);
    } catch (error) {
      console.error(error);
    }
  };
}

export function updateAlertDefinitionOption(alertDefinition: Partial<AlertDefinition>): ThunkResult<void> {
  return dispatch => {
    dispatch(updateAlertDefinition(alertDefinition));
  };
}

export function queryOptionsChange(queryOptions: QueryGroupOptions): ThunkResult<void> {
  return dispatch => {
    dispatch(setQueryOptions(queryOptions));
  };
}
