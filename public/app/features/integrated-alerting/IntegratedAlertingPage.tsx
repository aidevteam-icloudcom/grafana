import React, { FC, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { UrlQueryValue } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { TabsBar, TabContent, Tab, useStyles } from '@grafana/ui';
import { Breadcrumb, PageModel } from 'app/core/components/Breadcrumb';
import { StoreState } from 'app/types';

import { DEFAULT_TAB } from './IntegratedAlerting.constants';
import { Messages } from './IntegratedAlerting.messages';
import { getStyles } from './IntegratedAlerting.styles';
import { TabKeys } from './IntegratedAlerting.types';
import { Alerts, AlertRuleTemplate, AlertRules, NotificationChannel } from './components';

const tabs = [
  {
    title: Messages.tabs.alerts,
    id: TabKeys.alerts,
    path: `integrated-alerting/${TabKeys.alerts}`,
    component: <Alerts key={TabKeys.alerts} />,
  },
  {
    title: Messages.tabs.alertRules,
    id: TabKeys.alertRules,
    path: `integrated-alerting/${TabKeys.alertRules}`,
    component: <AlertRules key={TabKeys.alertRules} />,
  },
  {
    title: Messages.tabs.alertRuleTemplates,
    id: TabKeys.alertRuleTemplates,
    path: `integrated-alerting/${TabKeys.alertRuleTemplates}`,
    component: <AlertRuleTemplate key={TabKeys.alertRuleTemplates} />,
  },
  {
    title: Messages.tabs.notificationChannels,
    id: TabKeys.notificationChannels,
    path: `integrated-alerting/${TabKeys.notificationChannels}`,
    component: <NotificationChannel key={TabKeys.notificationChannels} />,
  },
];

const pageModel: PageModel = {
  title: 'Integrated Alerting',
  path: 'integrated-alerting',
  id: 'integrated-alerting',
  children: tabs.map(({ title, id, path }) => ({ title, id, path })),
};

const isValidTab = (tab: UrlQueryValue) => Object.values(TabKeys).includes(tab as TabKeys);

const IntegratedAlertingPage: FC = () => {
  const styles = useStyles(getStyles);
  const [activeTab, setActiveTab] = useState<TabKeys>(DEFAULT_TAB);
  const tabKey = useSelector((state: StoreState) => state.location.routeParams.tab);
  const { path: basePath } = pageModel;

  const selectTab = useCallback(
    (tabKey: string) => {
      getLocationSrv().update({
        path: `${basePath}/${tabKey}`,
      });
    },
    [basePath]
  );

  useEffect(() => {
    isValidTab(tabKey) || selectTab(DEFAULT_TAB);
  }, [selectTab, tabKey]);

  useEffect(() => {
    setActiveTab(isValidTab(tabKey) ? (tabKey as TabKeys) : DEFAULT_TAB);
  }, [tabKey]);

  return (
    <div className={styles.integratedAlertingWrapper}>
      <Breadcrumb pageModel={pageModel} />
      <TabsBar>
        {tabs.map((tab) => (
          <Tab key={tab.id} label={tab.title} active={tab.id === activeTab} onChangeTab={() => selectTab(tab.id)} />
        ))}
      </TabsBar>
      <TabContent>{tabs.find((tab) => tab.id === activeTab).component}</TabContent>
    </div>
  );
};

export default IntegratedAlertingPage;
