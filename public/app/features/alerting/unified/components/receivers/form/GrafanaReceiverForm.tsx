import React, { useMemo, useState } from 'react';

import { Alert, LoadingPlaceholder } from '@grafana/ui';
import {
  AlertManagerCortexConfig,
  GrafanaManagedReceiverConfig,
  Receiver,
  TestReceiversAlert,
} from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { alertmanagerApi } from '../../../api/alertmanagerApi';
import { testReceiversAction, updateAlertManagerConfigAction } from '../../../state/actions';
import { GrafanaChannelValues, ReceiverFormValues } from '../../../types/receiver-form';
import { GRAFANA_RULES_SOURCE_NAME, isVanillaPrometheusAlertManagerDataSource } from '../../../utils/datasource';
import {
  formChannelValuesToGrafanaChannelConfig,
  formValuesToGrafanaReceiver,
  grafanaReceiverToFormValues,
  updateConfigWithReceiver,
} from '../../../utils/receiver-form';
import { ProvisionedResource, ProvisioningAlert } from '../../Provisioning';
import { useOnCallIntegration } from '../grafanaAppReceivers/onCall/useOnCallIntegration';

import { GrafanaCommonChannelSettings } from './GrafanaCommonChannelSettings';
import { ReceiverForm } from './ReceiverForm';
import { TestContactPointModal } from './TestContactPointModal';
import { Notifier } from './notifiers';

interface Props {
  alertManagerSourceName: string;
  config: AlertManagerCortexConfig;
  existing?: Receiver;
}

const defaultChannelValues: GrafanaChannelValues = Object.freeze({
  __id: '',
  secureSettings: {},
  settings: {},
  secureFields: {},
  disableResolveMessage: false,
  type: 'email',
});

export const GrafanaReceiverForm = ({ existing, alertManagerSourceName, config }: Props) => {
  const dispatch = useDispatch();

  const {
    onCallNotifierMeta,
    extendOnCallNotifierFeatures,
    extendOnCalReceivers,
    onCallFormValidators,
    createOnCallIntegrations,
    isLoadingOnCallIntegration,
    hasOnCallError,
  } = useOnCallIntegration();

  const { useGrafanaNotifiersQuery } = alertmanagerApi;
  const { data: grafanaNotifiers = [], isLoading: isLoadingNotifiers } = useGrafanaNotifiersQuery();

  const [testChannelValues, setTestChannelValues] = useState<GrafanaChannelValues>();

  // transform receiver DTO to form values
  const [existingValue, id2original] = useMemo((): [
    ReceiverFormValues<GrafanaChannelValues> | undefined,
    Record<string, GrafanaManagedReceiverConfig>
  ] => {
    if (!existing || isLoadingNotifiers || isLoadingOnCallIntegration) {
      return [undefined, {}];
    }

    return grafanaReceiverToFormValues(extendOnCalReceivers(existing), grafanaNotifiers);
  }, [existing, isLoadingNotifiers, grafanaNotifiers, extendOnCalReceivers, isLoadingOnCallIntegration]);

  const onSubmit = async (values: ReceiverFormValues<GrafanaChannelValues>) => {
    const newReceiver = formValuesToGrafanaReceiver(values, id2original, defaultChannelValues);
    const receiverWithOnCall = await createOnCallIntegrations(newReceiver);

    const newConfig = updateConfigWithReceiver(config, receiverWithOnCall, existing?.name);
    dispatch(
      updateAlertManagerConfigAction({
        newConfig: newConfig,
        oldConfig: config,
        alertManagerSourceName: GRAFANA_RULES_SOURCE_NAME,
        successMessage: existing ? 'Contact point updated.' : 'Contact point created',
        redirectPath: '/alerting/notifications',
      })
    );
  };

  const onTestChannel = (values: GrafanaChannelValues) => {
    setTestChannelValues(values);
  };

  const testNotification = (alert?: TestReceiversAlert) => {
    if (testChannelValues) {
      const existing: GrafanaManagedReceiverConfig | undefined = id2original[testChannelValues.__id];
      const chan = formChannelValuesToGrafanaChannelConfig(testChannelValues, defaultChannelValues, 'test', existing);

      const payload = {
        alertManagerSourceName,
        receivers: [
          {
            name: 'test',
            grafana_managed_receiver_configs: [chan],
          },
        ],
        alert,
      };

      dispatch(testReceiversAction(payload));
    }
  };

  const takenReceiverNames = useMemo(
    () => config.alertmanager_config.receivers?.map(({ name }) => name).filter((name) => name !== existing?.name) ?? [],
    [config, existing]
  );

  // if any receivers in the contact point have a "provenance", the entire contact point should be readOnly
  const hasProvisionedItems = existing
    ? (existing.grafana_managed_receiver_configs ?? []).some((item) => Boolean(item.provenance))
    : false;

  // this basically checks if we can manage the selected alert manager data source, either because it's a Grafana Managed one
  // or a Mimir-based AlertManager
  const isManageableAlertManagerDataSource = !isVanillaPrometheusAlertManagerDataSource(alertManagerSourceName);

  const isEditable = isManageableAlertManagerDataSource && !hasProvisionedItems;
  const isTestable = isManageableAlertManagerDataSource || hasProvisionedItems;

  if (isLoadingNotifiers || isLoadingOnCallIntegration) {
    return <LoadingPlaceholder text="Loading notifiers..." />;
  }

  const notifiers: Notifier[] = grafanaNotifiers.map((n) => {
    if (n.type === 'oncall') {
      return {
        dto: extendOnCallNotifierFeatures(n),
        meta: onCallNotifierMeta,
      };
    }

    return { dto: n };
  });

  return (
    <>
      {hasOnCallError && (
        <Alert severity="error" title="Loading OnCall integration failed">
          Grafana OnCall plugin has been enabled in your Grafana instances but it is not reachable. Please check the
          plugin configuration
        </Alert>
      )}

      {hasProvisionedItems && <ProvisioningAlert resource={ProvisionedResource.ContactPoint} />}

      <ReceiverForm<GrafanaChannelValues>
        isEditable={isEditable}
        isTestable={isTestable}
        config={config}
        onSubmit={onSubmit}
        initialValues={existingValue}
        onTestChannel={onTestChannel}
        notifiers={notifiers}
        alertManagerSourceName={alertManagerSourceName}
        defaultItem={{ ...defaultChannelValues }}
        takenReceiverNames={takenReceiverNames}
        commonSettingsComponent={GrafanaCommonChannelSettings}
        customValidators={onCallFormValidators}
      />
      <TestContactPointModal
        onDismiss={() => setTestChannelValues(undefined)}
        isOpen={!!testChannelValues}
        onTest={(alert) => testNotification(alert)}
      />
    </>
  );
};
