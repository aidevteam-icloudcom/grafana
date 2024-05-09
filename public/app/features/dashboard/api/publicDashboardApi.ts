import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react';
import { lastValueFrom } from 'rxjs';

import { BackendSrvRequest, FetchError, getBackendSrv, isFetchError } from '@grafana/runtime/src';
// @todo: replace barrel import path
import { notifyApp } from 'app/core/actions/index';
import { createErrorNotification, createSuccessNotification } from 'app/core/copy/appNotification';
import {
  PublicDashboard,
  PublicDashboardSettings,
  SessionDashboard,
  SessionUser,
} from 'app/features/dashboard/components/ShareModal/SharePublicDashboard/SharePublicDashboardUtils';
// @todo: replace barrel import path
import { DashboardModel } from 'app/features/dashboard/state/index';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import {
  PublicDashboardListWithPagination,
  PublicDashboardListWithPaginationResponse,
} from 'app/features/manage-dashboards/types';

type ReqOptions = {
  manageError?: (err: unknown) => { error: unknown };
  showErrorAlert?: boolean;
};

function isFetchBaseQueryError(error: unknown): error is { error: FetchError } {
  return typeof error === 'object' && error != null && 'error' in error;
}

const backendSrvBaseQuery =
  ({ baseUrl }: { baseUrl: string }): BaseQueryFn<BackendSrvRequest & ReqOptions> =>
  async (requestOptions) => {
    try {
      const { data: responseData, ...meta } = await lastValueFrom(
        getBackendSrv().fetch({
          ...requestOptions,
          url: baseUrl + requestOptions.url,
          showErrorAlert: requestOptions.showErrorAlert,
        })
      );
      return { data: responseData, meta };
    } catch (error) {
      return requestOptions.manageError ? requestOptions.manageError(error) : { error };
    }
  };

const getConfigError = (err: unknown) => ({ error: isFetchError(err) && err.status !== 404 ? err : null });

export const publicDashboardApi = createApi({
  reducerPath: 'publicDashboardApi',
  baseQuery: backendSrvBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PublicDashboard', 'AuditTablePublicDashboard', 'UsersWithActiveSessions', 'ActiveUserDashboards'],
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPublicDashboard: builder.query<PublicDashboard | undefined, string>({
      query: (dashboardUid) => ({
        url: `/dashboards/uid/${dashboardUid}/public-dashboards`,
        manageError: getConfigError,
        showErrorAlert: false,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (e) {
          if (isFetchBaseQueryError(e) && isFetchError(e.error)) {
            dispatch(notifyApp(createErrorNotification(e.error.data.message)));
          }
        }
      },
      providesTags: (result, error, dashboardUid) => [{ type: 'PublicDashboard', id: dashboardUid }],
    }),
    createPublicDashboard: builder.mutation<
      PublicDashboard,
      { dashboard: DashboardModel | DashboardScene; payload: Partial<PublicDashboardSettings> }
    >({
      query: (params) => {
        const dashUid = params.dashboard instanceof DashboardScene ? params.dashboard.state.uid : params.dashboard.uid;
        return {
          url: `/dashboards/uid/${dashUid}/public-dashboards`,
          method: 'POST',
          data: params.payload,
        };
      },
      async onQueryStarted({ dashboard, payload }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(notifyApp(createSuccessNotification('Dashboard is public!')));

        if (dashboard instanceof DashboardScene) {
          dashboard.setState({
            meta: { ...dashboard.state.meta, publicDashboardEnabled: data.isEnabled, publicDashboardUid: data.uid },
          });
        } else {
          // Update runtime meta flag
          dashboard.updateMeta({
            publicDashboardUid: data.uid,
            publicDashboardEnabled: data.isEnabled,
          });
        }
      },
      invalidatesTags: (result, error, { dashboard }) => [
        { type: 'PublicDashboard', id: dashboard instanceof DashboardScene ? dashboard.state.uid : dashboard.uid },
      ],
    }),
    updatePublicDashboard: builder.mutation<
      PublicDashboard,
      {
        dashboard: (Pick<DashboardModel, 'uid'> & Partial<Pick<DashboardModel, 'updateMeta'>>) | DashboardScene;
        payload: Partial<PublicDashboard>;
      }
    >({
      query: ({ payload, dashboard }) => {
        const dashUid = dashboard instanceof DashboardScene ? dashboard.state.uid : dashboard.uid;
        return {
          url: `/dashboards/uid/${dashUid}/public-dashboards/${payload.uid}`,
          method: 'PATCH',
          data: payload,
        };
      },
      async onQueryStarted({ dashboard }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(notifyApp(createSuccessNotification('Public dashboard updated!')));

        if (dashboard instanceof DashboardScene) {
          dashboard.setState({
            meta: { ...dashboard.state.meta, publicDashboardEnabled: data.isEnabled, publicDashboardUid: data.uid },
          });
        } else {
          dashboard.updateMeta?.({
            publicDashboardUid: data.uid,
            publicDashboardEnabled: data.isEnabled,
          });
        }
      },
      invalidatesTags: (result, error, { payload }) => [
        { type: 'PublicDashboard', id: payload.dashboardUid },
        'AuditTablePublicDashboard',
      ],
    }),
    addRecipient: builder.mutation<void, { recipient: string; dashboardUid: string; uid: string }>({
      query: () => ({
        url: '',
      }),
    }),
    deleteRecipient: builder.mutation<
      void,
      { recipientUid: string; recipientEmail: string; dashboardUid: string; uid: string }
    >({
      query: () => ({
        url: '',
      }),
    }),
    reshareAccessToRecipient: builder.mutation<void, { recipientUid: string; uid: string }>({
      query: () => ({
        url: '',
      }),
    }),
    getActiveUsers: builder.query<SessionUser[], void>({
      query: () => ({
        url: '/',
      }),
      providesTags: ['UsersWithActiveSessions'],
    }),
    getActiveUserDashboards: builder.query<SessionDashboard[], string>({
      query: () => ({
        url: '',
      }),
      providesTags: (result, _, email) => [{ type: 'ActiveUserDashboards', id: email }],
    }),
    listPublicDashboards: builder.query<PublicDashboardListWithPagination, number | void>({
      query: (page = 1) => ({
        url: `/dashboards/public-dashboards?page=${page}&perpage=8`,
      }),
      transformResponse: (response: PublicDashboardListWithPaginationResponse) => ({
        ...response,
        totalPages: Math.ceil(response.totalCount / response.perPage),
      }),
      providesTags: ['AuditTablePublicDashboard'],
    }),
    deletePublicDashboard: builder.mutation<
      void,
      { dashboard?: DashboardModel | DashboardScene; dashboardUid: string; uid: string }
    >({
      query: (params) => ({
        url: `/dashboards/uid/${params.dashboardUid}/public-dashboards/${params.uid}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ dashboard, uid }, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(notifyApp(createSuccessNotification('Public dashboard deleted!')));

        if (dashboard instanceof DashboardScene) {
          dashboard.setState({
            meta: { ...dashboard.state.meta, publicDashboardUid: uid, publicDashboardEnabled: false },
          });
        } else {
          dashboard?.updateMeta({
            publicDashboardUid: uid,
            publicDashboardEnabled: false,
          });
        }
      },
      invalidatesTags: (result, error, { dashboardUid }) => [
        { type: 'PublicDashboard', id: dashboardUid },
        'AuditTablePublicDashboard',
        'UsersWithActiveSessions',
        'ActiveUserDashboards',
      ],
    }),
    revokeAllAccess: builder.mutation<void, { email: string }>({
      query: () => ({
        url: '',
      }),
    }),
  }),
});

export const {
  useGetPublicDashboardQuery,
  useCreatePublicDashboardMutation,
  useUpdatePublicDashboardMutation,
  useDeletePublicDashboardMutation,
  useListPublicDashboardsQuery,
  useAddRecipientMutation,
  useDeleteRecipientMutation,
  useReshareAccessToRecipientMutation,
  useGetActiveUsersQuery,
  useGetActiveUserDashboardsQuery,
  useRevokeAllAccessMutation,
} = publicDashboardApi;
