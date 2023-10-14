import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2, Select, Button, Field, InlineField, InlineSwitch, Alert } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import appEvents from 'app/core/app_events';
import { createSuccessNotification } from 'app/core/copy/appNotification';
import { MAX_HISTORY_ITEMS } from 'app/core/history/RichHistoryLocalStorage';
import { Trans, t } from 'app/core/internationalization';
import { dispatch } from 'app/store/store';

import { supportedFeatures } from '../../../core/history/richHistoryStorageProvider';
import { ShowConfirmModalEvent } from '../../../types/events';

export interface RichHistorySettingsProps {
  retentionPeriod: number;
  starredTabAsFirstTab: boolean;
  activeDatasourceOnly: boolean;
  onChangeRetentionPeriod: (option: SelectableValue<number>) => void;
  toggleStarredTabAsFirstTab: () => void;
  toggleactiveDatasourceOnly: () => void;
  deleteRichHistory: () => void;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    spaceBetween: css`
      margin-bottom: ${theme.spacing(3)};
    `,
    input: css`
      max-width: 200px;
    `,
    bold: css`
      font-weight: ${theme.typography.fontWeightBold};
    `,
    bottomMargin: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

const retentionPeriodOptions = [
  { value: 2, label: t('explore.history.rich-history-settings-tab.retention-period.2-days', '2 days') },
  { value: 5, label: t('explore.history.rich-history-settings-tab.retention-period.5-days', '5 days') },
  { value: 7, label: t('explore.history.rich-history-settings-tab.retention-period.1-week', '1 week') },
  { value: 14, label: t('explore.history.rich-history-settings-tab.retention-period.2-weeks', '2 weeks') },
];

export function RichHistorySettingsTab(props: RichHistorySettingsProps) {
  const {
    retentionPeriod,
    starredTabAsFirstTab,
    activeDatasourceOnly,
    onChangeRetentionPeriod,
    toggleStarredTabAsFirstTab,
    toggleactiveDatasourceOnly,
    deleteRichHistory,
  } = props;
  const styles = useStyles2(getStyles);
  const selectedOption = retentionPeriodOptions.find((v) => v.value === retentionPeriod);
  let optionLabel = selectedOption?.label;

  const onDelete = () => {
    appEvents.publish(
      new ShowConfirmModalEvent({
        title: t('explore.history.rich-history-settings-tab.delete-title', 'Delete'),
        text: t(
          'explore.history.rich-history-settings-tab.delete-confirm-text',
          'Are you sure you want to permanently delete your query history?'
        ),
        yesText: t('explore.history.rich-history-settings-tab.delete-yes-text', 'Delete'),
        icon: 'trash-alt',
        onConfirm: () => {
          deleteRichHistory();
          dispatch(
            notifyApp(
              createSuccessNotification(
                t('explore.history.rich-history-settings-tab.query-history-deleted', 'Query history deleted')
              )
            )
          );
        },
      })
    );
  };

  return (
    <div className={styles.container}>
      {supportedFeatures().changeRetention ? (
        <Field
          label={t('explore.history.rich-history-settings-tab.history-time-span', 'History time span')}
          description={t(
            'explore.history.rich-history-settings-tab.history-time-span-description',
            `Select the period of time for which Grafana will save your query history. Up to ${MAX_HISTORY_ITEMS} entries will be stored.`
          )}
        >
          <div className={styles.input}>
            <Select value={selectedOption} options={retentionPeriodOptions} onChange={onChangeRetentionPeriod}></Select>
          </div>
        </Field>
      ) : (
        <Alert
          severity="info"
          title={t('explore.history.rich-history-settings-tab.history-time-span', 'History time span')}
        >
          <Trans i18nKey="explore.history.rich-history-settings-tab.alert-info">
            Grafana will keep entries up to {{ optionLabel }}. Starred entries will not be deleted.
          </Trans>
        </Alert>
      )}
      <InlineField
        label={t(
          'explore.history.rich-history-settings-tab.change-default-tab',
          'Change the default active tab from “Query history” to “Starred”'
        )}
        className={styles.spaceBetween}
      >
        <InlineSwitch
          id="explore-query-history-settings-default-active-tab"
          value={starredTabAsFirstTab}
          onChange={toggleStarredTabAsFirstTab}
        />
      </InlineField>
      {supportedFeatures().onlyActiveDataSource && (
        <InlineField
          label={t(
            'explore.history.rich-history-settings-tab.only-show-active-datasource',
            'Only show queries for data source currently active in Explore'
          )}
          className={styles.spaceBetween}
        >
          <InlineSwitch
            id="explore-query-history-settings-data-source-behavior"
            value={activeDatasourceOnly}
            onChange={toggleactiveDatasourceOnly}
          />
        </InlineField>
      )}
      {supportedFeatures().clearHistory && (
        <div>
          <div className={styles.bold}>
            <Trans i18nKey="explore.history.rich-history-settings-tab.clear-query-history">Clear query history</Trans>
          </div>
          <div className={styles.bottomMargin}>
            <Trans i18nKey="explore.history.rich-history-settings-tab.clear-history-info">
              Delete all of your query history, permanently.
            </Trans>
          </div>
          <Button variant="destructive" onClick={onDelete}>
            <Trans i18nKey="explore.history.rich-history-settings-tab.clear-query-history-button">
              Clear query history
            </Trans>
          </Button>
        </div>
      )}
    </div>
  );
}
