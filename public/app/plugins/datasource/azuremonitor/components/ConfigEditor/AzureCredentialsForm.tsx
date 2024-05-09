import React, { useMemo } from 'react';

import { SelectableValue } from '@grafana/data';
import { ConfigSection } from '@grafana/experimental';
import { Select, Field } from '@grafana/ui';

import { selectors } from '../../e2e/selectors';
// @todo: replace barrel import path
import { AzureAuthType, AzureCredentials } from '../../types/index';

import { AppRegistrationCredentials } from './AppRegistrationCredentials';
import CurrentUserFallbackCredentials from './CurrentUserFallbackCredentials';

export interface Props {
  managedIdentityEnabled: boolean;
  workloadIdentityEnabled: boolean;
  userIdentityEnabled: boolean;
  credentials: AzureCredentials;
  azureCloudOptions?: SelectableValue[];
  legacyAzureCloudOptions?: SelectableValue[];
  onCredentialsChange: (updatedCredentials: AzureCredentials) => void;
  disabled?: boolean;
  children?: JSX.Element;
}

export const AzureCredentialsForm = (props: Props) => {
  const {
    credentials,
    azureCloudOptions,
    legacyAzureCloudOptions,
    onCredentialsChange,
    disabled,
    managedIdentityEnabled,
    workloadIdentityEnabled,
    userIdentityEnabled,
  } = props;

  const authTypeOptions = useMemo(() => {
    let opts: Array<SelectableValue<AzureAuthType>> = [
      {
        value: 'clientsecret',
        label: 'App Registration',
      },
    ];

    if (managedIdentityEnabled) {
      opts.push({
        value: 'msi',
        label: 'Managed Identity',
      });
    }

    if (workloadIdentityEnabled) {
      opts.push({
        value: 'workloadidentity',
        label: 'Workload Identity',
      });
    }

    if (userIdentityEnabled) {
      opts.unshift({
        value: 'currentuser',
        label: 'Current User',
      });
    }

    return opts;
  }, [managedIdentityEnabled, workloadIdentityEnabled, userIdentityEnabled]);

  const onAuthTypeChange = (selected: SelectableValue<AzureAuthType>) => {
    const defaultAuthType = managedIdentityEnabled
      ? 'msi'
      : workloadIdentityEnabled
        ? 'workloadidentity'
        : userIdentityEnabled
          ? 'currentuser'
          : 'clientsecret';
    const updated: AzureCredentials = {
      ...credentials,
      authType: selected.value || defaultAuthType,
    };
    onCredentialsChange(updated);
  };

  return (
    <ConfigSection title="Authentication">
      {authTypeOptions.length > 1 && (
        <Field
          label="Authentication"
          description="Choose the type of authentication to Azure services"
          data-testid={selectors.components.configEditor.authType.select}
          htmlFor="authentication-type"
        >
          <Select
            className="width-15"
            value={authTypeOptions.find((opt) => opt.value === credentials.authType)}
            options={authTypeOptions}
            onChange={onAuthTypeChange}
            disabled={disabled}
          />
        </Field>
      )}
      {credentials.authType === 'clientsecret' && (
        <AppRegistrationCredentials
          credentials={credentials}
          azureCloudOptions={legacyAzureCloudOptions}
          onCredentialsChange={onCredentialsChange}
          disabled={disabled}
        />
      )}
      {props.children}
      {credentials.authType === 'currentuser' && (
        <CurrentUserFallbackCredentials
          credentials={credentials}
          azureCloudOptions={azureCloudOptions}
          onCredentialsChange={onCredentialsChange}
          disabled={disabled}
          managedIdentityEnabled={managedIdentityEnabled}
          workloadIdentityEnabled={workloadIdentityEnabled}
          userIdentityEnabled={userIdentityEnabled}
        />
      )}
    </ConfigSection>
  );
};

export default AzureCredentialsForm;
