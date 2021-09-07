import { createSlice, createEntityAdapter, EntityState, AnyAction } from '@reduxjs/toolkit';
import { PluginsState } from 'app/types';
import { fetchAll, fetchDetails, install, uninstall, loadPluginDashboards } from './actions';
import { CatalogPlugin, RequestInfo, RequestStatus } from '../types';
import { STATE_PREFIX } from '../constants';

// TODO<remove `PluginsState &` once the "plugin_admin_enabled" feature flag is removed>
type ReducerState = PluginsState & {
  items: EntityState<CatalogPlugin>;
  requests: Record<string, RequestInfo>;
};

export const pluginsAdapter = createEntityAdapter<CatalogPlugin>();

const isPendingRequest = (action: AnyAction) => new RegExp(`${STATE_PREFIX}\/(.*)\/pending`).test(action.type);

const isFulfilledRequest = (action: AnyAction) => new RegExp(`${STATE_PREFIX}\/(.*)\/fulfilled`).test(action.type);

const isRejectedRequest = (action: AnyAction) => new RegExp(`${STATE_PREFIX}\/(.*)\/rejected`).test(action.type);

// Extract the trailing '/pending', '/rejected', or '/fulfilled'
const getOriginalActionType = (type: string) => {
  const separator = type.lastIndexOf('/');

  return type.substring(0, separator);
};

export const { reducer } = createSlice({
  name: 'plugins',
  initialState: {
    items: pluginsAdapter.getInitialState(),
    requests: {},
    // Backwards compatibility
    // (we need to have the following fields in the store as well to be backwards compatible with other parts of Grafana)
    // TODO<remove once the "plugin_admin_enabled" feature flag is removed>
    plugins: [],
    errors: [],
    searchQuery: '',
    hasFetched: false,
    dashboards: [],
    isLoadingPluginDashboards: false,
    panels: {},
  } as ReducerState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      // Fetch All
      .addCase(fetchAll.fulfilled, (state, action) => {
        pluginsAdapter.upsertMany(state.items, action.payload);
      })
      // Fetch Details
      .addCase(fetchDetails.fulfilled, (state, action) => {
        pluginsAdapter.updateOne(state.items, action.payload);
      })
      // Install
      .addCase(install.fulfilled, (state, action) => {
        pluginsAdapter.updateOne(state.items, action.payload);
      })
      // Uninstall
      .addCase(uninstall.fulfilled, (state, action) => {
        pluginsAdapter.updateOne(state.items, action.payload);
      })
      // Load a panel plugin (backward-compatibility)
      // TODO<remove once the "plugin_admin_enabled" feature flag is removed>
      .addCase(`${STATE_PREFIX}/loadPanelPlugin/fulfilled`, (state, action: AnyAction) => {
        state.panels[action.payload.meta!.id] = action.payload;
      })
      // Start loading panel dashboards (backward-compatibility)
      // TODO<remove once the "plugin_admin_enabled" feature flag is removed>
      .addCase(loadPluginDashboards.pending, (state, action) => {
        state.isLoadingPluginDashboards = true;
        state.dashboards = [];
      })
      // Load panel dashboards (backward-compatibility)
      // TODO<remove once the "plugin_admin_enabled" feature flag is removed>
      .addCase(loadPluginDashboards.fulfilled, (state, action) => {
        state.isLoadingPluginDashboards = false;
        state.dashboards = action.payload;
      })
      .addMatcher(isPendingRequest, (state, action) => {
        state.requests[getOriginalActionType(action.type)] = {
          status: RequestStatus.Pending,
        };
      })
      .addMatcher(isFulfilledRequest, (state, action) => {
        state.requests[getOriginalActionType(action.type)] = {
          status: RequestStatus.Fulfilled,
        };
      })
      .addMatcher(isRejectedRequest, (state, action) => {
        state.requests[getOriginalActionType(action.type)] = {
          status: RequestStatus.Rejected,
          error: action.payload,
        };
      }),
});
