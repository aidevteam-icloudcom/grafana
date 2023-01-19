import { EMPTY, interval, Observable, of } from 'rxjs';
import { thunkTester } from 'test/core/thunk/thunkTester';
import { assertIsDefined } from 'test/helpers/asserts';

import {
  ArrayVector,
  DataQuery,
  DataQueryResponse,
  DataSourceApi,
  DataSourceJsonData,
  DataSourceWithLogsVolumeSupport,
  LoadingState,
  MutableDataFrame,
  RawTimeRange,
} from '@grafana/data';
import { ExploreId, ExploreItemState, StoreState, SupplementaryQueryType, ThunkDispatch } from 'app/types';

import { reducerTester } from '../../../../test/core/redux/reducerTester';
import { configureStore } from '../../../store/configureStore';
import { setTimeSrv } from '../../dashboard/services/TimeSrv';

import { createDefaultInitialState } from './helpers';
import { saveCorrelationsAction } from './main';
import {
  addQueryRowAction,
  addResultsToCache,
  cancelQueries,
  cancelQueriesAction,
  cleanSupplementaryQueryAction,
  clearCache,
  importQueries,
  queryReducer,
  runQueries,
  scanStartAction,
  scanStopAction,
  storeSupplementaryQueryDataProviderAction,
  setSupplementaryQueryEnabled,
  addQueryRow,
} from './query';
import { makeExplorePaneState } from './utils';

const { testRange, defaultInitialState } = createDefaultInitialState();

const datasources: DataSourceApi[] = [
  {
    name: 'testDs',
    type: 'postgres',
    uid: 'ds1',
    getRef: () => {
      return { type: 'postgres', uid: 'ds1' };
    },
  } as DataSourceApi<DataQuery, DataSourceJsonData, {}>,
  {
    name: 'testDs2',
    type: 'postgres',
    uid: 'ds2',
    getRef: () => {
      return { type: 'postgres', uid: 'ds2' };
    },
  } as DataSourceApi<DataQuery, DataSourceJsonData, {}>,
];

jest.mock('app/features/dashboard/services/TimeSrv', () => ({
  ...jest.requireActual('app/features/dashboard/services/TimeSrv'),
  getTimeSrv: () => ({
    init: jest.fn(),
    timeRange: jest.fn().mockReturnValue({}),
  }),
}));

let useFeatToggles = {
  exploreMixedDatasource: false,
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getTemplateSrv: () => ({
    updateTimeRange: jest.fn(),
  }),
  getDataSourceSrv: () => {
    return {
      get: (uid?: string) => datasources.find((ds) => ds.uid === uid) || datasources[0],
    };
  },
  config: {
    featureToggles: () => useFeatToggles,
  },
}));

function setupQueryResponse(state: StoreState) {
  const leftDatasourceInstance = assertIsDefined(state.explore[ExploreId.left].datasourceInstance);

  jest.mocked(leftDatasourceInstance.query).mockReturnValueOnce(
    of({
      error: { message: 'test error' },
      data: [
        new MutableDataFrame({
          fields: [{ name: 'test', values: new ArrayVector() }],
          meta: {
            preferredVisualisationType: 'graph',
          },
        }),
      ],
    } as DataQueryResponse)
  );
}

describe('runQueries', () => {
  const setupTests = () => {
    setTimeSrv({ init() {} } as any);
    return configureStore({
      ...(defaultInitialState as any),
    });
  };

  it('should pass dataFrames to state even if there is error in response', async () => {
    const { dispatch, getState } = setupTests();
    setupQueryResponse(getState());
    await dispatch(saveCorrelationsAction([]));
    await dispatch(runQueries(ExploreId.left));
    expect(getState().explore[ExploreId.left].showMetrics).toBeTruthy();
    expect(getState().explore[ExploreId.left].graphResult).toBeDefined();
  });

  it('should modify the request-id for log-volume queries', async () => {
    const { dispatch, getState } = setupTests();
    setupQueryResponse(getState());
    await dispatch(saveCorrelationsAction([]));
    await dispatch(runQueries(ExploreId.left));

    const state = getState().explore[ExploreId.left];
    expect(state.queryResponse.request?.requestId).toBe('explore_left');
    const datasource = state.datasourceInstance as unknown as DataSourceWithLogsVolumeSupport<DataQuery>;
    expect(datasource.getLogsVolumeDataProvider).toBeCalledWith(
      expect.objectContaining({
        requestId: 'explore_left_log_volume',
      })
    );
  });

  it('should set state to done if query completes without emitting', async () => {
    const { dispatch, getState } = setupTests();
    const leftDatasourceInstance = assertIsDefined(getState().explore[ExploreId.left].datasourceInstance);
    jest.mocked(leftDatasourceInstance.query).mockReturnValueOnce(EMPTY);
    await dispatch(saveCorrelationsAction([]));
    await dispatch(runQueries(ExploreId.left));
    await new Promise((resolve) => setTimeout(() => resolve(''), 500));
    expect(getState().explore[ExploreId.left].queryResponse.state).toBe(LoadingState.Done);
  });

  it('shows results only after correlations are loaded', async () => {
    const { dispatch, getState } = setupTests();
    setupQueryResponse(getState());
    await dispatch(runQueries(ExploreId.left));
    expect(getState().explore[ExploreId.left].graphResult).not.toBeDefined();
    await dispatch(saveCorrelationsAction([]));
    expect(getState().explore[ExploreId.left].graphResult).toBeDefined();
  });
});

describe('running queries', () => {
  it('should cancel running query when cancelQueries is dispatched', async () => {
    const unsubscribable = interval(1000);
    unsubscribable.subscribe();
    const exploreId = ExploreId.left;
    const initialState = {
      explore: {
        [exploreId]: {
          datasourceInstance: { name: 'testDs' },
          initialized: true,
          loading: true,
          querySubscription: unsubscribable,
          queries: ['A'],
          range: testRange,
          supplementaryQueries: { [SupplementaryQueryType.LogsVolume]: { enabled: true } },
        },
      },

      user: {
        orgId: 'A',
      },
    };

    const dispatchedActions = await thunkTester(initialState)
      .givenThunk(cancelQueries)
      .whenThunkIsDispatched(exploreId);

    expect(dispatchedActions).toEqual([
      scanStopAction({ exploreId }),
      cancelQueriesAction({ exploreId }),
      storeSupplementaryQueryDataProviderAction({ exploreId, type: SupplementaryQueryType.LogsVolume }),
      cleanSupplementaryQueryAction({ exploreId, type: SupplementaryQueryType.LogsVolume }),
    ]);
  });
});

describe('importing queries', () => {
  describe('when importing queries between the same type of data source', () => {
    it('remove datasource property from all of the queries', async () => {
      const { dispatch, getState }: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            datasourceInstance: datasources[0],
          },
        },
      });

      await dispatch(
        importQueries(
          ExploreId.left,
          [
            { datasource: { type: 'postgresql', uid: 'ds1' }, refId: 'refId_A' },
            { datasource: { type: 'postgresql', uid: 'ds1' }, refId: 'refId_B' },
          ],
          datasources[0],
          datasources[1]
        )
      );

      expect(getState().explore[ExploreId.left].queries[0]).toHaveProperty('refId', 'refId_A');
      expect(getState().explore[ExploreId.left].queries[1]).toHaveProperty('refId', 'refId_B');
      expect(getState().explore[ExploreId.left].queries[0]).toHaveProperty('datasource.uid', 'ds2');
      expect(getState().explore[ExploreId.left].queries[1]).toHaveProperty('datasource.uid', 'ds2');
    });
  });
});

describe('reducer', () => {
  describe('scanning', () => {
    it('should start scanning', () => {
      const initialState: ExploreItemState = {
        ...makeExplorePaneState(),
        scanning: false,
      };

      reducerTester<ExploreItemState>()
        .givenReducer(queryReducer, initialState)
        .whenActionIsDispatched(scanStartAction({ exploreId: ExploreId.left }))
        .thenStateShouldEqual({
          ...initialState,
          scanning: true,
        });
    });
    it('should stop scanning', () => {
      const initialState = {
        ...makeExplorePaneState(),
        scanning: true,
        scanRange: {} as RawTimeRange,
      };

      reducerTester<ExploreItemState>()
        .givenReducer(queryReducer, initialState)
        .whenActionIsDispatched(scanStopAction({ exploreId: ExploreId.left }))
        .thenStateShouldEqual({
          ...initialState,
          scanning: false,
          scanRange: undefined,
        });
    });
  });

  describe('query rows', () => {
    describe('addQueryRowAction', () => {
      it('should add query row when no query row yet (addQueryRowAction)', () => {
        reducerTester<ExploreItemState>()
          .givenReducer(queryReducer, {
            queries: [],
          } as unknown as ExploreItemState)
          .whenActionIsDispatched(
            addQueryRowAction({
              exploreId: ExploreId.left,
              query: { refId: 'A', key: 'mockKey' },
              index: 0,
            })
          )
          .thenStateShouldEqual({
            queries: [{ refId: 'A', key: 'mockKey' }],
            queryKeys: ['mockKey-0'],
          } as unknown as ExploreItemState);
      });
      it('should add query row when there is already one query row (addQueryRowAction)', () => {
        reducerTester<ExploreItemState>()
          .givenReducer(queryReducer, {
            queries: [{ refId: 'A', key: 'initialRow', datasource: { type: 'loki' } }],
          } as unknown as ExploreItemState)
          .whenActionIsDispatched(
            addQueryRowAction({
              exploreId: ExploreId.left,
              query: { refId: 'B', key: 'mockKey', datasource: { type: 'loki' } },
              index: 0,
            })
          )
          .thenStateShouldEqual({
            queries: [
              { refId: 'A', key: 'initialRow', datasource: { type: 'loki' } },
              { refId: 'B', key: 'mockKey', datasource: { type: 'loki' } },
            ],
            queryKeys: ['initialRow-0', 'mockKey-1'],
          } as unknown as ExploreItemState);
      });
    });
    describe('addQueryRow with mixed datasources disabled', () => {
      it('should add query row when there is not yet a row', async () => {
        const exploreId = ExploreId.left;
        let dispatch: ThunkDispatch, getState: () => StoreState;

        const store: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
          ...defaultInitialState,
          explore: {
            [exploreId]: {
              ...defaultInitialState.explore[exploreId],
              queries: [],
              datasourceInstance: {
                query: jest.fn(),
                getRef: jest.fn(),
                meta: {
                  id: 'postgres',
                },
              },
            },
          },
        } as unknown as Partial<StoreState>);

        dispatch = store.dispatch;
        getState = store.getState;

        setupQueryResponse(getState());

        await dispatch(addQueryRow(exploreId, 1));

        expect(getState().explore[exploreId].datasourceInstance?.meta?.id).toBe('postgres');
        expect(getState().explore[exploreId].queries).toHaveLength(1);
        expect(getState().explore[exploreId].queryKeys).toEqual(['ds1-0']);
      });

      it('should add another query row if there are two rows already', async () => {
        const exploreId = ExploreId.left;
        let dispatch: ThunkDispatch, getState: () => StoreState;

        const store: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
          ...defaultInitialState,
          explore: {
            [exploreId]: {
              ...defaultInitialState.explore[exploreId],
              queries: [
                {
                  datasource: { type: 'loki', uid: 'ds3' },
                  refId: 'C',
                },
                {
                  datasource: { type: 'loki', uid: 'ds4' },
                  refId: 'D',
                },
              ],
              datasourceInstance: {
                query: jest.fn(),
                getRef: jest.fn(),
                meta: {
                  id: 'loki',
                },
              },
            },
          },
        } as unknown as Partial<StoreState>);

        dispatch = store.dispatch;
        getState = store.getState;

        setupQueryResponse(getState());

        await dispatch(addQueryRow(exploreId, 1));

        expect(getState().explore[exploreId].datasourceInstance?.meta?.id).toBe('loki');
        expect(getState().explore[exploreId].queries).toHaveLength(3);
        expect(getState().explore[exploreId].queryKeys).toEqual(['ds3-0', 'ds4-1', 'ds4-2']);
      });
    });
    describe('addQueryRow with mixed datasources enabled', () => {
      useFeatToggles = {
        exploreMixedDatasource: true,
      };

      it('should add query row whith rootdatasource when there is not yet a row', async () => {
        const exploreId = ExploreId.left;
        let dispatch: ThunkDispatch, getState: () => StoreState;

        const store: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
          ...defaultInitialState,
          explore: {
            [exploreId]: {
              ...defaultInitialState.explore[exploreId],
              queries: [],
              datasourceInstance: {
                query: jest.fn(),
                getRef: jest.fn(),
                meta: {
                  id: 'mixed',
                },
              },
            },
          },
        } as unknown as Partial<StoreState>);

        dispatch = store.dispatch;
        getState = store.getState;

        setupQueryResponse(getState());

        await dispatch(addQueryRow(exploreId, 1));

        expect(getState().explore[exploreId].datasourceInstance?.meta?.id).toBe('mixed');
        expect(getState().explore[exploreId].queries).toHaveLength(1);
        expect(getState().explore[exploreId].queries[0]?.datasource?.type).toBe('postgres');
        expect(getState().explore[exploreId].queryKeys).toEqual(['ds1-0']);
      });

      it('should add another query row if there are two rows already', async () => {
        const exploreId = ExploreId.left;
        let dispatch: ThunkDispatch, getState: () => StoreState;

        const store: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
          ...defaultInitialState,
          explore: {
            [exploreId]: {
              ...defaultInitialState.explore[exploreId],
              queries: [
                {
                  datasource: { type: 'postgres', uid: 'ds3' },
                  refId: 'C',
                },
                {
                  datasource: { type: 'loki', uid: 'ds4' },
                  refId: 'D',
                },
              ],
              datasourceInstance: {
                query: jest.fn(),
                getRef: jest.fn(),
                meta: {
                  id: 'postgres',
                },
              },
            },
          },
        } as unknown as Partial<StoreState>);

        dispatch = store.dispatch;
        getState = store.getState;

        setupQueryResponse(getState());

        await dispatch(addQueryRow(exploreId, 1));

        expect(getState().explore[exploreId].datasourceInstance?.meta?.id).toBe('postgres');
        expect(getState().explore[exploreId].queries).toHaveLength(3);
        expect(getState().explore[exploreId].queries[2]?.datasource?.type).toBe('loki');
        expect(getState().explore[exploreId].queryKeys).toEqual(['ds3-0', 'ds4-1', 'ds4-2']);
      });
    });
  });

  describe('caching', () => {
    it('should add response to cache', async () => {
      const { dispatch, getState }: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            queryResponse: {
              series: [{ name: 'test name' }],
              state: LoadingState.Done,
            },
            absoluteRange: { from: 1621348027000, to: 1621348050000 },
          },
        },
      });

      await dispatch(addResultsToCache(ExploreId.left));

      expect(getState().explore[ExploreId.left].cache).toEqual([
        { key: 'from=1621348027000&to=1621348050000', value: { series: [{ name: 'test name' }], state: 'Done' } },
      ]);
    });

    it('should not add response to cache if response is still loading', async () => {
      const { dispatch, getState }: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            queryResponse: { series: [{ name: 'test name' }], state: LoadingState.Loading },
            absoluteRange: { from: 1621348027000, to: 1621348050000 },
          },
        },
      });

      await dispatch(addResultsToCache(ExploreId.left));

      expect(getState().explore[ExploreId.left].cache).toEqual([]);
    });

    it('should not add duplicate response to cache', async () => {
      const { dispatch, getState }: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            queryResponse: {
              series: [{ name: 'test name' }],
              state: LoadingState.Done,
            },
            absoluteRange: { from: 1621348027000, to: 1621348050000 },
            cache: [
              {
                key: 'from=1621348027000&to=1621348050000',
                value: { series: [{ name: 'old test name' }], state: LoadingState.Done },
              },
            ],
          },
        },
      });

      await dispatch(addResultsToCache(ExploreId.left));

      expect(getState().explore[ExploreId.left].cache).toHaveLength(1);
      expect(getState().explore[ExploreId.left].cache).toEqual([
        { key: 'from=1621348027000&to=1621348050000', value: { series: [{ name: 'old test name' }], state: 'Done' } },
      ]);
    });

    it('should clear cache', async () => {
      const { dispatch, getState }: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            cache: [
              {
                key: 'from=1621348027000&to=1621348050000',
                value: { series: [{ name: 'old test name' }], state: 'Done' },
              },
            ],
          },
        },
      });

      await dispatch(clearCache(ExploreId.left));

      expect(getState().explore[ExploreId.left].cache).toEqual([]);
    });
  });

  describe('log volume', () => {
    let dispatch: ThunkDispatch,
      getState: () => StoreState,
      unsubscribes: Function[],
      mockLogsVolumeDataProvider: () => Observable<DataQueryResponse>;

    beforeEach(() => {
      unsubscribes = [];
      mockLogsVolumeDataProvider = () => {
        return {
          subscribe: () => {
            const unsubscribe = jest.fn();
            unsubscribes.push(unsubscribe);
            return {
              unsubscribe,
            };
          },
        } as unknown as Observable<DataQueryResponse>;
      };

      const store: { dispatch: ThunkDispatch; getState: () => StoreState } = configureStore({
        ...(defaultInitialState as any),
        explore: {
          [ExploreId.left]: {
            ...defaultInitialState.explore[ExploreId.left],
            datasourceInstance: {
              query: jest.fn(),
              getRef: jest.fn(),
              meta: {
                id: 'something',
              },
              getLogsVolumeDataProvider: () => {
                return mockLogsVolumeDataProvider();
              },
            },
          },
        },
      });

      dispatch = store.dispatch;
      getState = store.getState;

      setupQueryResponse(getState());
    });

    it('should cancel any unfinished logs volume queries when a new query is run', async () => {
      await dispatch(runQueries(ExploreId.left));
      // first query is run automatically
      // loading in progress - one subscription created, not cleaned up yet
      expect(unsubscribes).toHaveLength(1);
      expect(unsubscribes[0]).not.toBeCalled();

      setupQueryResponse(getState());
      await dispatch(runQueries(ExploreId.left));
      // a new query is run while log volume query is not resolve yet...
      expect(unsubscribes[0]).toBeCalled();
      // first subscription is cleaned up, a new subscription is created automatically
      expect(unsubscribes).toHaveLength(2);
      expect(unsubscribes[1]).not.toBeCalled();
    });

    it('should cancel log volume query when the main query is canceled', async () => {
      await dispatch(runQueries(ExploreId.left));
      expect(unsubscribes).toHaveLength(1);
      expect(unsubscribes[0]).not.toBeCalled();

      await dispatch(cancelQueries(ExploreId.left));
      expect(unsubscribes).toHaveLength(1);
      expect(unsubscribes[0]).toBeCalled();

      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeUndefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeUndefined();
    });

    it('should load logs volume after running the query', async () => {
      await dispatch(runQueries(ExploreId.left));
      expect(unsubscribes).toHaveLength(1);
    });

    it('should clean any incomplete log volume data when main query is canceled', async () => {
      mockLogsVolumeDataProvider = () => {
        return of({ state: LoadingState.Loading, error: undefined, data: [] });
      };
      await dispatch(runQueries(ExploreId.left));

      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeDefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data!.state
      ).toBe(LoadingState.Loading);
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeDefined();

      await dispatch(cancelQueries(ExploreId.left));
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeUndefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeUndefined();
    });

    it('keeps complete log volume data when main query is canceled', async () => {
      mockLogsVolumeDataProvider = () => {
        return of(
          { state: LoadingState.Loading, error: undefined, data: [] },
          { state: LoadingState.Done, error: undefined, data: [{}] }
        );
      };
      await dispatch(runQueries(ExploreId.left));

      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeDefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data!.state
      ).toBe(LoadingState.Done);
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeDefined();

      await dispatch(cancelQueries(ExploreId.left));
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeDefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data!.state
      ).toBe(LoadingState.Done);
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeUndefined();
    });

    it('do not load logsVolume data when disabled', async () => {
      // turn logsvolume off
      dispatch(setSupplementaryQueryEnabled(ExploreId.left, false, SupplementaryQueryType.LogsVolume));
      expect(getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].enabled).toBe(
        false
      );

      // verify that if we run a query, it will not do logsvolume, but the Provider will still be set
      await dispatch(runQueries(ExploreId.left));
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].data
      ).toBeUndefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataSubscription
      ).toBeUndefined();
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeDefined();
    });

    it('load logsVolume data when it gets enabled', async () => {
      // first it is disabled
      dispatch(setSupplementaryQueryEnabled(ExploreId.left, false, SupplementaryQueryType.LogsVolume));

      // runQueries sets up the logsVolume query, but does not run it
      await dispatch(runQueries(ExploreId.left));
      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataProvider
      ).toBeDefined();

      // we turn logsvolume on
      await dispatch(setSupplementaryQueryEnabled(ExploreId.left, true, SupplementaryQueryType.LogsVolume));

      // verify it was turned on
      expect(getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].enabled).toBe(
        true
      );

      expect(
        getState().explore[ExploreId.left].supplementaryQueries[SupplementaryQueryType.LogsVolume].dataSubscription
      ).toBeDefined();
    });
  });
});
