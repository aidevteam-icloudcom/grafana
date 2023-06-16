import { css } from '@emotion/css';
import { compact } from 'lodash';
import React, { lazy, Suspense, useEffect, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import { Stack } from '../../../../../../plugins/datasource/parca/QueryEditor/Stack';
import { AlertQuery, Labels } from '../../../../../../types/unified-alerting-dto';
import { alertRuleApi } from '../../../api/alertRuleApi';
import { Folder } from '../RuleFolderPicker';

import { useGetAlertManagersSourceNamesAndImage } from './useGetAlertManagersSourceNamesAndImage';

const NotificationPreviewByAlertManager = lazy(() => import('./NotificationPreviewByAlertManager'));

interface NotificationPreviewProps {
  customLabels: Array<{
    key: string;
    value: string;
  }>;
  alertQueries: AlertQuery[];
  condition: string;
  folder: Folder;
  alertName?: string;
  alertUid?: string;
}

export const NOTIFICATION_PREVIEW_TITLE = 'Alert instance routing preview';

export const NotificationPreview = ({
  alertQueries,
  customLabels,
  condition,
  folder,
  alertName,
  alertUid,
}: NotificationPreviewProps) => {
  const styles = useStyles2(getStyles);
  // potential instances are the instances that are going to be routed to the notification policies
  const [potentialInstances, setPotentialInstances] = useState<Labels[]>([]);

  const { usePreviewMutation } = alertRuleApi;

  const [trigger, { data, isLoading, isUninitialized: previewUninitialized }] = usePreviewMutation();

  useEffect(() => {
    // any time data is updated from trigger, we need to update the potential instances
    // convert data to list of labels: are the representation of the potential instances
    if (!isLoading) {
      const labels = data ?? [];

      const potentialInstances = compact(labels.flatMap((label) => label?.labels));
      setPotentialInstances(potentialInstances);
    }
  }, [data, isLoading]);

  const onPreview = () => {
    // Get the potential labels given the alert queries, the condition and the custom labels (autogenerated labels are calculated on the BE side)
    trigger({
      alertQueries: alertQueries,
      condition: condition,
      customLabels: customLabels,
      folder: folder,
      alertName: alertName,
      alertUid: alertUid,
    });
  };

  // Get list of alert managers source name + image
  const alertManagerSourceNamesAndImage = useGetAlertManagersSourceNamesAndImage();

  const onlyOneAM = alertManagerSourceNamesAndImage.length === 1;
  const renderHowToPreview = !Boolean(data?.length) && !isLoading;

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.routePreviewHeaderRow}>
        <h4 className={styles.previewHeader}>{NOTIFICATION_PREVIEW_TITLE}</h4>
        <div className={styles.button}>
          <Button icon="sync" variant="secondary" type="button" onClick={onPreview}>
            Preview routing
          </Button>
        </div>
      </div>
      {!renderHowToPreview && (
        <div className={styles.textMuted}>
          Based on the labels you have added above and the labels that have been automatically assigned, alert instances
          are being route to notification policies in the way listed bellow. Expand the notification policies to see the
          instances which are going to be routed to them.
        </div>
      )}
      {isLoading && <div className={styles.textMuted}>Loading...</div>}
      {renderHowToPreview && (
        <div className={styles.previewHowToText}>
          {`When your query and labels are configured, click "Preview routing" to see the results here.`}
        </div>
      )}
      {!isLoading && !previewUninitialized && potentialInstances.length > 0 && (
        <Suspense fallback={<LoadingPlaceholder text="Loading preview..." />}>
          {alertManagerSourceNamesAndImage.map((alertManagerSource) => (
            <NotificationPreviewByAlertManager
              alertManagerSource={alertManagerSource}
              potentialInstances={potentialInstances}
              onlyOneAM={onlyOneAM}
              key={alertManagerSource.name}
            />
          ))}
        </Suspense>
      )}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  collapsableSection: css`
    width: auto;
    border: 0;
  `,
  textMuted: css`
    color: ${theme.colors.text.secondary};
  `,
  previewHowToText: css`
    display: flex;
    color: ${theme.colors.text.secondary};
    justify-content: center;
    font-size: ${theme.typography.size.sm};
  `,
  previewHeader: css`
    margin: 0;
  `,
  routePreviewHeaderRow: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  `,
  collapseLabel: css`
    flex: 1;
  `,
  button: css`
    justify-content: flex-end;
    display: flex;
  `,
  tagsInDetails: css`
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
  `,
  policyPathItemMatchers: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};
  `,
});
