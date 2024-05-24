import React from 'react';

import { publicDashboardApi } from 'app/features/dashboard/api/publicDashboardApi';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import ShareConfiguration from '../ShareConfiguration';

import CreatePublicSharing from './CreatePublicSharing';

export const PublicSharing = ({ dashboard, onCancel }: { dashboard: DashboardScene; onCancel: () => void }) => {
  const { data: publicDashboard, isError } = publicDashboardApi.endpoints?.getPublicDashboard.useQueryState(
    dashboard.state.uid!
  );

  return (
    <>
      {!publicDashboard ? (
        <CreatePublicSharing dashboard={dashboard} onCancel={onCancel} hasError={isError} />
      ) : (
        <ShareConfiguration dashboard={dashboard} />
      )}
    </>
  );
};
