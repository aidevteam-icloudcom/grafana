import { css } from '@emotion/css';
import React, { FC, useEffect } from 'react';
import { Subscription } from 'rxjs';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { IconName, Tab, TabContent, TabsBar, useForceUpdate, useStyles2 } from '@grafana/ui';
import AlertTabIndex from 'app/features/alerting/AlertTabIndex';
import { PanelAlertTab } from 'app/features/alerting/unified/PanelAlertTab';
import { PanelQueriesChangedEvent, PanelTransformationsChangedEvent } from 'app/types/events';

import { DashboardModel, PanelModel } from '../../state';
import { TransformationsEditor } from '../TransformationsEditor/TransformationsEditor';

import { PanelEditorQueries } from './PanelEditorQueries';
import { PanelEditorTab, PanelEditorTabId } from './types';

interface PanelEditorTabsProps {
  panel: PanelModel;
  dashboard: DashboardModel;
  tabs: PanelEditorTab[];
  onChangeTab: (tab: PanelEditorTab) => void;
}

export const PanelEditorTabs: FC<PanelEditorTabsProps> = React.memo(({ panel, dashboard, tabs, onChangeTab }) => {
  const forceUpdate = useForceUpdate();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    const eventSubs = new Subscription();
    eventSubs.add(panel.events.subscribe(PanelQueriesChangedEvent, forceUpdate));
    eventSubs.add(panel.events.subscribe(PanelTransformationsChangedEvent, forceUpdate));
    return () => eventSubs.unsubscribe();
  }, [panel, forceUpdate]);

  const activeTab = tabs.find((item) => item.active)!;

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <TabsBar className={styles.tabBar} hideBorder>
        {tabs.map((tab) => {
          if (tab.id === PanelEditorTabId.Alert) {
            return renderAlertTab(tab, panel, dashboard, onChangeTab);
          }
          return (
            <Tab
              key={tab.id}
              label={tab.text}
              active={tab.active}
              onChangeTab={() => onChangeTab(tab)}
              icon={tab.icon as IconName}
              counter={getCounter(panel, tab)}
            />
          );
        })}
      </TabsBar>
      <TabContent className={styles.tabContent}>
        {activeTab.id === PanelEditorTabId.Query && <PanelEditorQueries panel={panel} queries={panel.targets} />}
        {activeTab.id === PanelEditorTabId.Alert && <AlertTabIndex panel={panel} dashboard={dashboard} />}
        {activeTab.id === PanelEditorTabId.Transform && <TransformationsEditor panel={panel} />}
      </TabContent>
    </div>
  );
});

PanelEditorTabs.displayName = 'PanelEditorTabs';

function getCounter(panel: PanelModel, tab: PanelEditorTab) {
  switch (tab.id) {
    case PanelEditorTabId.Query:
      return panel.targets.length;
    case PanelEditorTabId.Alert:
      return panel.alert ? 1 : 0;
    case PanelEditorTabId.Transform:
      const transformations = panel.getTransformations() ?? [];
      return transformations.length;
  }

  return null;
}

function renderAlertTab(
  tab: PanelEditorTab,
  panel: PanelModel,
  dashboard: DashboardModel,
  onChangeTab: (tab: PanelEditorTab) => void
) {
  const alertingDisabled = !config.alertingEnabled && !config.unifiedAlertingEnabled;

  if (alertingDisabled) {
    return null;
  }

  if (config.unifiedAlertingEnabled) {
    return (
      <PanelAlertTab
        key={tab.id}
        label={tab.text}
        active={tab.active}
        onChangeTab={() => onChangeTab(tab)}
        icon={tab.icon as IconName}
        panel={panel}
        dashboard={dashboard}
      />
    );
  }

  if (config.alertingEnabled) {
    return (
      <Tab
        key={tab.id}
        label={tab.text}
        active={tab.active}
        onChangeTab={() => onChangeTab(tab)}
        icon={tab.icon as IconName}
        counter={getCounter(panel, tab)}
      />
    );
  }

  return null;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
    `,
    tabBar: css`
      padding-left: ${theme.spacing(2)};
    `,
    tabContent: css`
      padding: 0;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-height: 0;
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.components.panel.borderColor};
      border-left: none;
      border-bottom: none;
      border-top-right-radius: ${theme.shape.borderRadius(1.5)};
    `,
  };
};
