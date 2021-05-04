import React, { FunctionComponent, useEffect, useMemo, useReducer, useState } from 'react';
import { SelectableValue } from '@grafana/data';
import { AzureCredentialsForm } from './AzureCredentialsForm';
import { InlineFormLabel, LegacyForms, Button } from '@grafana/ui';
const { Select, Switch } = LegacyForms;
import { AzureDataSourceSettings, AzureCredentials } from '../types';
import {
  getCredentials,
  getLogAnalyticsCredentials,
  isCredentialsComplete,
  updateLogAnalyticsCredentials,
  updateLogAnalyticsSameAs,
} from '../credentials';

export interface Props {
  options: AzureDataSourceSettings;
  updateOptions: (optionsFunc: (options: AzureDataSourceSettings) => AzureDataSourceSettings) => void;
  getSubscriptions: (route?: string) => Promise<Array<SelectableValue<string>>>;
  getWorkspaces: (subscriptionId: string) => Promise<Array<SelectableValue<string>>>;
}

export const AnalyticsConfig: FunctionComponent<Props> = (props: Props) => {
  const { updateOptions, getSubscriptions, getWorkspaces } = props;
  const primaryCredentials = useMemo(() => getCredentials(props.options), [props.options]);
  const logAnalyticsCredentials = useMemo(() => getLogAnalyticsCredentials(props.options), [props.options]);
  const subscriptionId = logAnalyticsCredentials
    ? props.options.jsonData.logAnalyticsSubscriptionId
    : props.options.jsonData.subscriptionId;

  const hasRequiredFields =
    subscriptionId &&
    (logAnalyticsCredentials
      ? isCredentialsComplete(logAnalyticsCredentials)
      : isCredentialsComplete(primaryCredentials));

  const defaultWorkspace = props.options.jsonData.logAnalyticsDefaultWorkspace;

  const [workspaces, setWorkspaces] = useState<SelectableValue[]>([]);
  const [loadWorkspaces, onLoadWorkspaces] = useReducer((val) => val + 1, 0);
  useEffect(() => {
    if (!hasRequiredFields || !subscriptionId) {
      return;
    }
    let canceled = false;
    getWorkspaces(subscriptionId).then((result) => {
      if (!canceled) {
        setWorkspaces(result);
        if (!defaultWorkspace && result.length > 0) {
          updateOptions((options) => {
            return {
              ...options,
              jsonData: {
                ...options.jsonData,
                logAnalyticsDefaultWorkspace: result[0].value,
              },
            };
          });
        }
      }
    });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadWorkspaces, subscriptionId]);

  const [sameAsSwitched, setSameAsSwitched] = useState(false);

  const onCredentialsChange = (updatedCredentials: AzureCredentials) => {
    updateOptions((options) => updateLogAnalyticsCredentials(options, updatedCredentials));
  };

  const onLogAnalyticsSameAsChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const sameAs = event.currentTarget.checked;
    updateOptions((options) => updateLogAnalyticsSameAs(options, sameAs));
    setSameAsSwitched(true);
  };

  const onLogAnalyticsDefaultSubscriptionChange = (subscriptionId: string | undefined) => {
    updateOptions((options) => {
      return {
        ...options,
        jsonData: {
          ...options.jsonData,
          logAnalyticsSubscriptionId: subscriptionId || '',
        },
      };
    });
  };

  const onDefaultWorkspaceChange = (selected: SelectableValue<string>) => {
    updateOptions((options) => {
      return {
        ...options,
        jsonData: {
          ...options.jsonData,
          logAnalyticsDefaultWorkspace: selected.value || '',
        },
      };
    });
  };

  const tooltipAttribute = {
    ...(!logAnalyticsCredentials && {
      tooltip: 'Workspaces are pulled from default subscription selected above.',
    }),
  };

  const showSameAsHelpMsg = sameAsSwitched && !primaryCredentials.clientSecret;

  return (
    <>
      <h3 className="page-heading">Azure Monitor Logs Details</h3>
      <Switch
        label="Same details as Azure Monitor API"
        checked={!logAnalyticsCredentials}
        onChange={onLogAnalyticsSameAsChange}
        {...tooltipAttribute}
      />
      {showSameAsHelpMsg && (
        <div className="grafana-info-box m-t-2">
          <div className="alert-body">
            <p>Re-enter your Azure Monitor Client Secret to use this setting.</p>
          </div>
        </div>
      )}
      {logAnalyticsCredentials && (
        <AzureCredentialsForm
          credentials={logAnalyticsCredentials}
          defaultSubscription={subscriptionId}
          onCredentialsChange={onCredentialsChange}
          onDefaultSubscriptionChange={onLogAnalyticsDefaultSubscriptionChange}
          getSubscriptions={() => getSubscriptions('workspacesloganalytics')}
        />
      )}
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel
              className="width-12"
              tooltip="Choose the default/preferred Workspace for Azure Log Analytics queries."
            >
              Default Workspace
            </InlineFormLabel>
            <div className="width-25">
              <Select
                value={workspaces.find((opt) => opt.value === defaultWorkspace)}
                options={workspaces}
                defaultValue={defaultWorkspace}
                onChange={onDefaultWorkspaceChange}
              />
            </div>
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <div className="max-width-30 gf-form-inline">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onLoadWorkspaces}
                disabled={!hasRequiredFields}
              >
                Load Workspaces
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsConfig;
