import { DataQuery } from '@grafana/data';
import { DashboardDataDTO } from 'app/types';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

export interface SaveToNewDashboardDTO {
  dashboardName: string;
  folderId: number;
  queries: DataQuery[];
  visualization: string;
}

const createDashboardApiCall = (dashboard: DashboardDataDTO, folderId: number) => {
  // TODO: properly type this
  return getBackendSrv().fetch<any>({
    url: '/api/dashboards/db/',
    method: 'POST',
    data: {
      dashboard,
      folderId,
    },
    showErrorAlert: false,
  });
};

const createDashboard = (dashboardName: string, folderId: number, queries: DataQuery[], visualization: string) => {
  const dashboard = getDashboardSrv().create({ title: dashboardName }, { folderId });

  dashboard.addPanel({ targets: queries, type: visualization });

  return lastValueFrom(createDashboardApiCall(dashboard.getSaveModelClone(), folderId));
};

export const addToDashboard = async (data: SaveToNewDashboardDTO): Promise<string> => {
  const res = await createDashboard(data.dashboardName, data.folderId, data.queries, data.visualization);
  return res.data.url;
};
