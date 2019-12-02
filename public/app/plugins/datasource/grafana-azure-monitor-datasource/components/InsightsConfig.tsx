import React, { PureComponent, ChangeEvent } from 'react';
import { FormLabel, Button, Input } from '@grafana/ui';
import { AzureDataSourceSettings } from '../types';

export interface Props {
  options: AzureDataSourceSettings;
  onDatasourceUpdate: (config: any) => void;
}
export class InsightsConfig extends PureComponent<Props> {
  onAppInsightsAppIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onDatasourceUpdate, options } = this.props;
    onDatasourceUpdate({
      ...options,
      jsonData: {
        ...options.jsonData,
        appInsightsAppId: event.target.value,
      },
    });
  };

  onAppInsightsApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onDatasourceUpdate, options } = this.props;
    onDatasourceUpdate({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        appInsightsApiKey: event.target.value,
      },
    });
  };

  onAppInsightsResetApiKey = () => {
    const { onDatasourceUpdate, options } = this.props;
    onDatasourceUpdate({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        appInsightsApiKey: '',
      },
      secureJsonFields: {
        ...options.secureJsonFields,
        appInsightsApiKey: false,
      },
    });
  };

  render() {
    const { options } = this.props;
    return (
      <>
        <h3 className="page-heading">Application Insights Details</h3>
        <div className="gf-form-group">
          {options.secureJsonFields.appInsightsApiKey ? (
            <div className="gf-form-inline">
              <div className="gf-form">
                <FormLabel className="width-12">API Key</FormLabel>
                <Input className="width-25" placeholder="configured" disabled={true} />
              </div>
              <div className="gf-form">
                <div className="max-width-30 gf-form-inline">
                  <Button variant="secondary" type="button" onClick={this.onAppInsightsResetApiKey}>
                    reset
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="gf-form-inline">
              <div className="gf-form">
                <FormLabel className="width-12">API Key</FormLabel>
                <div className="width-15">
                  <Input
                    className="width-30"
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                    value={options.secureJsonData.appInsightsApiKey || ''}
                    onChange={this.onAppInsightsApiKeyChange}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="gf-form-inline">
            <div className="gf-form">
              <FormLabel className="width-12">Application ID</FormLabel>
              <div className="width-15">
                <Input
                  className="width-30"
                  value={options.jsonData.appInsightsAppId || ''}
                  onChange={this.onAppInsightsAppIdChange}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default InsightsConfig;
