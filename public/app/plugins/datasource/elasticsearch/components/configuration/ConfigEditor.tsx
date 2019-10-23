import React, { useEffect } from 'react';
import { DataSourceHttpSettings, DataSourcePluginOptionsEditorProps } from '@grafana/ui';
import { ElasticsearchOptions } from '../../types';
import { ElasticDetails } from './ElasticDetails';
import { LogsConfig } from './LogsConfig';

export type Props = DataSourcePluginOptionsEditorProps<ElasticsearchOptions>;
export const ConfigEditor = (props: Props) => {
  const { options, onOptionsChange } = props;

  // Apply some defaults on initial render
  useEffect(() => {
    const esVersion = options.jsonData.esVersion || 5;
    const defaultMaxConcurrentShardRequests = esVersion >= 70 ? 5 : 256;
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        timeField: options.jsonData.timeField || '@timestamp',
        esVersion,
        maxConcurrentShardRequests: options.jsonData.maxConcurrentShardRequests || defaultMaxConcurrentShardRequests,
        logMessageField: options.jsonData.logMessageField || '',
        logLevelField: options.jsonData.logLevelField || '',
      },
    });
  }, []);

  return (
    <>
      <DataSourceHttpSettings
        defaultUrl={'http://localhost:3100'}
        dataSourceConfig={options}
        showAccessOptions={true}
        onChange={onOptionsChange}
      />

      <ElasticDetails
        value={options}
        onChange={value => {
          // We need to do this as selecting no value would not overwrite the data during merge of objects. So we set
          // explicit value which mean this field should be empty and then delete that value before saving.
          if (value.jsonData.interval === 'none') {
            delete value.jsonData.interval;
          }
          onOptionsChange(value);
        }}
      />

      <LogsConfig
        value={options.jsonData}
        onChange={newValue =>
          onOptionsChange({
            ...options,
            jsonData: newValue,
          })
        }
      />
    </>
  );
};
