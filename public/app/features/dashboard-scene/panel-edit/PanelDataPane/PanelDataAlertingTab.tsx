import React from 'react';

import { IconName } from '@grafana/data';
import { SceneObjectBase, SceneComponentProps, SceneQueryRunner } from '@grafana/scenes';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { RulesTable } from 'app/features/alerting/unified/components/rules/RulesTable';
import { usePanelCombinedRules } from 'app/features/alerting/unified/hooks/usePanelCombinedRules';

import { getDashboardSceneFor, getPanelIdForVizPanel } from '../../utils/utils';
import { VizPanelManager } from '../VizPanelManager';

import { ScenesNewRuleFromPanelButton } from './NewAlertRuleButton';
import { PanelDataPaneTabState, PanelDataPaneTab, TabId } from './types';

export class PanelDataAlertingTab extends SceneObjectBase<PanelDataPaneTabState> implements PanelDataPaneTab {
  static Component = PanelDataAlertingTabRendered;

  tabId = TabId.Alert;
  icon: IconName = 'bell';
  private _panelManager: VizPanelManager;

  constructor(panelManager: VizPanelManager) {
    super({});
    this._panelManager = panelManager;
  }

  getTabLabel() {
    return 'Alert';
  }

  getDashboardUID() {
    const dashboard = getDashboardSceneFor(this._panelManager);
    return dashboard.state.uid!;
  }

  getDashboard() {
    return getDashboardSceneFor(this._panelManager);
  }

  getPanel() {
    return this._panelManager.state.panel;
  }

  public getQueryRunner(): SceneQueryRunner {
    return this._panelManager.queryRunner;
  }

  getPanelId() {
    return getPanelIdForVizPanel(this._panelManager.state.panel);
  }

  get panelManager() {
    return this._panelManager;
  }
}

function PanelDataAlertingTabRendered(props: SceneComponentProps<PanelDataAlertingTab>) {
  const { model } = props;

  const { errors, loading, rules } = usePanelCombinedRules({
    dashboardUID: model.getDashboardUID(),
    panelId: model.getPanelId(),
  });

  const alert = errors.length ? (
    <Alert title="Errors loading rules" severity="error">
      {errors.map((error, index) => (
        <div key={index}>Failed to load Grafana rules state: {error.message || 'Unknown error.'}</div>
      ))}
    </Alert>
  ) : null;

  if (loading && !rules.length) {
    return (
      <>
        {alert}
        <LoadingPlaceholder text="Loading rules..." />
      </>
    );
  }

  if (rules.length) {
    return <RulesTable rules={rules} />;
  }

  return (
    <div>
      <p>There are no alert rules linked to this panel.</p>
      <ScenesNewRuleFromPanelButton
        dashboard={model.getDashboard()}
        panel={model.getPanel()}
        queryRunner={model.getQueryRunner()}
      ></ScenesNewRuleFromPanelButton>
    </div>
  );
}
