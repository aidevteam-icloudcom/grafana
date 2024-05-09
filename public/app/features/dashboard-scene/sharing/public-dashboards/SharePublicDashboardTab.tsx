import React from 'react';

import { SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
// @todo: replace barrel import path
import { t } from 'app/core/internationalization/index';
import { useGetPublicDashboardQuery } from 'app/features/dashboard/api/publicDashboardApi';
import { Loader } from 'app/features/dashboard/components/ShareModal/SharePublicDashboard/SharePublicDashboard';
import { publicDashboardPersisted } from 'app/features/dashboard/components/ShareModal/SharePublicDashboard/SharePublicDashboardUtils';
import { shareDashboardType } from 'app/features/dashboard/components/ShareModal/utils';

import { SceneShareTabState } from '../types';

import { ConfigPublicDashboard } from './ConfigPublicDashboard';
import { CreatePublicDashboard } from './CreatePublicDashboard';

export class SharePublicDashboardTab extends SceneObjectBase<SceneShareTabState> {
  public tabId = shareDashboardType.publicDashboard;
  static Component = SharePublicDashboardTabRenderer;

  public getTabLabel() {
    return t('share-modal.tab-title.public-dashboard', 'Public Dashboard');
  }
}

function SharePublicDashboardTabRenderer({ model }: SceneComponentProps<SharePublicDashboardTab>) {
  const { data: publicDashboard, isLoading: isGetLoading } = useGetPublicDashboardQuery(
    model.state.dashboardRef.resolve().state.uid!
  );

  return (
    <>
      {isGetLoading ? (
        <Loader />
      ) : !publicDashboardPersisted(publicDashboard) ? (
        <CreatePublicDashboard model={model} />
      ) : (
        <ConfigPublicDashboard model={model} publicDashboard={publicDashboard} isGetLoading={isGetLoading} />
      )}
    </>
  );
}
