import React from 'react';

import { Drawer, LoadingPlaceholder, Stack, TextLink } from '@grafana/ui';

// @todo: replace barrel import path
import { t } from '../../../../core/internationalization/index';
import { createUrl } from '../utils/url';

const AlertRulesDrawerContent = React.lazy(
  () => import(/* webpackChunkName: "alert-rules-drawer-content" */ './AlertRulesDrawerContent')
);

interface Props {
  dashboardUid: string;
  onDismiss: () => void;
}

export function AlertRulesDrawer({ dashboardUid, onDismiss }: Props) {
  return (
    <Drawer title="Alert rules" subtitle={<DrawerSubtitle dashboardUid={dashboardUid} />} onClose={onDismiss} size="lg">
      <React.Suspense fallback={<LoadingPlaceholder text="Loading alert rules" />}>
        <AlertRulesDrawerContent dashboardUid={dashboardUid} />
      </React.Suspense>
    </Drawer>
  );
}

function DrawerSubtitle({ dashboardUid }: { dashboardUid: string }) {
  const searchParams = new URLSearchParams({ search: `dashboard:${dashboardUid}` });

  return (
    <Stack gap={2}>
      <div>{t('dashboard.alert-rules-drawer.subtitle', 'Alert rules related to this dashboard')}</div>
      <TextLink href={createUrl(`/alerting/list/?${searchParams.toString()}`)}>
        {t('dashboard.alert-rules-drawer.redirect-link', 'List in Grafana Alerting')}
      </TextLink>
    </Stack>
  );
}
