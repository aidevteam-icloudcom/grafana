﻿import { config } from '@grafana/runtime';
import { getBackendSrv } from 'app/core/services/backend_srv';
import { ApiKey, ThunkResult } from 'app/types';

import {
  apiKeysLoaded,
  includeExpiredToggled,
  isFetching,
  serviceAccountsUpgradeStatusLoaded,
  setSearchQuery,
} from './reducers';

export function addApiKey(apiKey: ApiKey, openModal: (key: string) => void): ThunkResult<void> {
  return async (dispatch) => {
    const result = await getBackendSrv().post('/api/auth/keys', apiKey);
    dispatch(setSearchQuery(''));
    dispatch(loadApiKeys());
    openModal(result.key);
  };
}

export function loadApiKeys(): ThunkResult<void> {
  return async (dispatch) => {
    dispatch(isFetching());
    const [keys, keysIncludingExpired] = await Promise.all([
      getBackendSrv().get('/api/auth/keys?includeExpired=false&accesscontrol=true'),
      getBackendSrv().get('/api/auth/keys?includeExpired=true&accesscontrol=true'),
    ]);
    dispatch(apiKeysLoaded({ keys, keysIncludingExpired }));
  };
}

export function deleteApiKey(id: number): ThunkResult<void> {
  return async (dispatch) => {
    getBackendSrv()
      .delete(`/api/auth/keys/${id}`)
      .then(() => dispatch(loadApiKeys()));
  };
}

export function getServiceAccountsUpgradeStatus(): ThunkResult<void> {
  return async (dispatch) => {
    // TODO: remove when service account enabled by default (or use another way to detect if it's enabled)
    if (config.featureToggles.serviceAccounts) {
      const result = await getBackendSrv().get('/api/serviceaccounts/upgradestatus');
      dispatch(serviceAccountsUpgradeStatusLoaded(!!result?.upgraded));
    }
  };
}

export function toggleIncludeExpired(): ThunkResult<void> {
  return (dispatch) => {
    dispatch(includeExpiredToggled());
  };
}
