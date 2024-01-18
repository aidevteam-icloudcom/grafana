import React from 'react';

import { TimeRange } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectRef, VizPanel } from '@grafana/scenes';
import { t } from 'app/core/internationalization';
import { ShareEmbed } from 'app/features/dashboard/components/ShareModal/ShareEmbed';
import { buildParams, shareDashboardType } from 'app/features/dashboard/components/ShareModal/utils';

import { DashboardScene } from '../scene/DashboardScene';
import { PanelTimeRange } from '../scene/PanelTimeRange';
import { getDashboardUrl } from '../utils/urlBuilders';
import { getPanelIdForVizPanel } from '../utils/utils';

import { SceneShareTabState } from './types';

export interface SharePanelEmbedTabState extends SceneShareTabState {
  panelRef: SceneObjectRef<VizPanel>;
  dashboardRef: SceneObjectRef<DashboardScene>;
}

export class SharePanelEmbedTab extends SceneObjectBase<SharePanelEmbedTabState> {
  public tabId = shareDashboardType.embed;
  static Component = SharePanelEmbedTabRenderer;

  public constructor(state: SharePanelEmbedTabState) {
    super(state);
  }

  public getTabLabel() {
    return t('share-modal.tab-title.panel-embed', 'Embed');
  }
}

function SharePanelEmbedTabRenderer({ model }: SceneComponentProps<SharePanelEmbedTab>) {
  const { panelRef, dashboardRef } = model.useState();
  const p = panelRef.resolve();

  const dash = dashboardRef.resolve();
  const { uid: dashUid } = dash.useState();
  const id = getPanelIdForVizPanel(p);
  const timeRangeState = sceneGraph.getTimeRange(p);

  const timeFrom = timeRangeState instanceof PanelTimeRange ? timeRangeState.state.timeFrom : undefined;

  return (
    <ShareEmbed
      panel={{
        id,
        timeFrom,
      }}
      range={timeRangeState.state.value}
      dashboard={{ uid: dashUid ?? '', time: timeRangeState.state.value }}
      buildIframe={getIframeBuilder(dash)}
    />
  );
}

const getIframeBuilder =
  (dashboard: DashboardScene) =>
  (
    useCurrentTimeRange: boolean,
    _dashboardUid: string,
    selectedTheme?: string,
    panel?: { timeFrom?: string; id: number },
    range?: TimeRange
  ) => {
    const params = buildParams({ useCurrentTimeRange, selectedTheme, panel, range });
    const panelId = params.get('editPanel') ?? params.get('viewPanel') ?? '';
    params.set('panelId', panelId);
    params.delete('editPanel');
    params.delete('viewPanel');

    const soloUrl = getDashboardUrl({
      absolute: true,
      soloRoute: true,
      uid: dashboard.state.uid,
      slug: dashboard.state.meta.slug,
      currentQueryParams: params.toString(),
    });
    return `<iframe src="${soloUrl}" width="450" height="200" frameborder="0"></iframe>`;
  };
