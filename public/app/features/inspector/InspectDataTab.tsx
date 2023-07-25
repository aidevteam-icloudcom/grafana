import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import React, { PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import {
  applyFieldOverrides,
  applyRawFieldOverrides,
  CoreApp,
  CSVConfig,
  DataFrame,
  DataTransformerID,
  FieldConfigSource,
  SelectableValue,
  TimeZone,
  transformDataFrame,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import { Button, Spinner, Table } from '@grafana/ui';
import { config } from 'app/core/config';
import { t, Trans } from 'app/core/internationalization';
import { PanelModel } from 'app/features/dashboard/state';
import { GetDataOptions } from 'app/features/query/state/PanelQueryRunner';

import { dataFrameToLogsModel } from '../logs/logsModel';

import { InspectDataOptions } from './InspectDataOptions';
import { getPanelInspectorStyles } from './styles';
import { downloadAsJson, downloadDataFrameAsCsv, downloadLogsModelAsTxt, downloadTraceAsJson } from './utils/download';

interface Props {
  isLoading: boolean;
  options: GetDataOptions;
  timeZone: TimeZone;
  app?: CoreApp;
  data?: DataFrame[];
  panel?: PanelModel;
  onOptionsChange?: (options: GetDataOptions) => void;
}

interface State {
  /** The string is joinByField transformation. Otherwise it is a dataframe index */
  selectedDataFrame: number | DataTransformerID;
  transformId: DataTransformerID;
  dataFrameIndex: number;
  transformationOptions: Array<SelectableValue<DataTransformerID>>;
  transformedData: DataFrame[];
  downloadForExcel: boolean;
}

export class InspectDataTab extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectedDataFrame: 0,
      dataFrameIndex: 0,
      transformId: DataTransformerID.noop,
      transformationOptions: buildTransformationOptions(),
      transformedData: props.data ?? [],
      downloadForExcel: false,
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (!this.props.data) {
      this.setState({ transformedData: [] });
      return;
    }

    if (this.props.options.withTransforms) {
      this.setState({ transformedData: this.props.data });
      return;
    }

    if (prevProps.data !== this.props.data || prevState.transformId !== this.state.transformId) {
      const currentTransform = this.state.transformationOptions.find((item) => item.value === this.state.transformId);

      if (currentTransform && currentTransform.transformer.id !== DataTransformerID.noop) {
        const selectedDataFrame = this.state.selectedDataFrame;
        const dataFrameIndex = this.state.dataFrameIndex;
        const subscription = transformDataFrame([currentTransform.transformer], this.props.data).subscribe((data) => {
          this.setState({ transformedData: data, selectedDataFrame, dataFrameIndex }, () => subscription.unsubscribe());
        });
        return;
      }

      this.setState({ transformedData: this.props.data });
      return;
    }
  }

  exportCsv = (dataFrame: DataFrame, csvConfig: CSVConfig = {}) => {
    const { panel } = this.props;
    const { transformId } = this.state;
    downloadDataFrameAsCsv(dataFrame, panel ? panel.getDisplayTitle() : 'Explore', csvConfig, transformId);
  };

  exportLogsAsTxt = () => {
    const { data, panel, app } = this.props;

    reportInteraction('grafana_logs_download_logs_clicked', {
      app,
      format: 'logs',
      area: 'inspector',
    });

    const logsModel = dataFrameToLogsModel(data || []);
    downloadLogsModelAsTxt(logsModel, panel ? panel.getDisplayTitle() : 'Explore');
  };

  exportTracesAsJson = () => {
    const { data, panel, app } = this.props;

    if (!data) {
      return;
    }

    for (const df of data) {
      // Only export traces
      if (df.meta?.preferredVisualisationType !== 'trace') {
        continue;
      }
      const traceFormat = downloadTraceAsJson(df, (panel ? panel.getDisplayTitle() : 'Explore') + '-traces');

      reportInteraction('grafana_traces_download_traces_clicked', {
        app,
        grafana_version: config.buildInfo.version,
        trace_format: traceFormat,
        location: 'inspector',
      });
    }
  };

  exportServiceGraph = () => {
    const { data, panel, app } = this.props;
    reportInteraction('grafana_traces_download_service_graph_clicked', {
      app,
      grafana_version: config.buildInfo.version,
      location: 'inspector',
    });

    if (!data) {
      return;
    }

    downloadAsJson(data, panel ? panel.getDisplayTitle() : 'Explore');
  };

  onDataFrameChange = (item: SelectableValue<DataTransformerID | number>) => {
    this.setState({
      transformId:
        item.value === DataTransformerID.joinByField ? DataTransformerID.joinByField : DataTransformerID.noop,
      dataFrameIndex: typeof item.value === 'number' ? item.value : 0,
      selectedDataFrame: item.value!,
    });
  };

  toggleDownloadForExcel = () => {
    this.setState((prevState) => ({
      downloadForExcel: !prevState.downloadForExcel,
    }));
  };

  /*  getProcessedData(): DataFrame[] {
    const { options, panel, timeZone } = this.props;
    const data = this.state.transformedData;

    if (!options.withFieldConfig || !panel) {
      return applyRawFieldOverrides(data);
    }

    const fieldConfig = this.cleanTableConfigFromFieldConfig(panel.type, panel.fieldConfig);

    // We need to apply field config as it's not done by PanelQueryRunner (even when withFieldConfig is true).
    // It's because transformers create new fields and data frames, and we need to clean field config of any table settings.
    return applyFieldOverrides({
      data,
      theme: config.theme2,
      fieldConfig,
      timeZone, // NO NEED FOR TIMEZONE
      replaceVariables: (value: string) => {
        return value;
      },
    });
  }

  // Because we visualize this data in a table we have to remove any custom table display settings
  cleanTableConfigFromFieldConfig(panelPluginId: string, fieldConfig: FieldConfigSource): FieldConfigSource {
    if (panelPluginId !== 'table') {
      return fieldConfig;
    }

    fieldConfig = cloneDeep(fieldConfig);
    // clear all table specific options
    fieldConfig.defaults.custom = {};

    // clear all table override properties
    for (const override of fieldConfig.overrides) {
      for (const prop of override.properties) {
        if (prop.id.startsWith('custom.')) {
          const index = override.properties.indexOf(prop);
          override.properties.slice(index, 1);
        }
      }
    }

    return fieldConfig;
  } */

  render() {
    const { isLoading, options, data, panel, onOptionsChange, app } = this.props;
    const { dataFrameIndex, transformId, transformedData, transformationOptions, selectedDataFrame, downloadForExcel } =
      this.state;
    const styles = getPanelInspectorStyles();

    if (isLoading) {
      return (
        <div>
          <Spinner inline={true} /> Loading
        </div>
      );
    }

    const dataFrames = getProcessedData(options, transformedData, panel);

    if (!dataFrames || !dataFrames.length) {
      return <div>No Data</div>;
    }

    // let's make sure we don't try to render a frame that doesn't exists
    const index = !dataFrames[dataFrameIndex] ? 0 : dataFrameIndex;
    const dataFrame = dataFrames[index];
    const hasLogs = dataFrames.some((df) => df?.meta?.preferredVisualisationType === 'logs');
    const hasTraces = dataFrames.some((df) => df?.meta?.preferredVisualisationType === 'trace');
    const hasServiceGraph = dataFrames.some((df) => df?.meta?.preferredVisualisationType === 'nodeGraph');

    return (
      <div className={styles.wrap} aria-label={selectors.components.PanelInspector.Data.content}>
        <div className={styles.toolbar}>
          <InspectDataOptions
            data={data}
            panel={panel}
            options={options}
            dataFrames={dataFrames}
            transformId={transformId}
            transformationOptions={transformationOptions}
            selectedDataFrame={selectedDataFrame}
            downloadForExcel={downloadForExcel}
            onOptionsChange={onOptionsChange}
            onDataFrameChange={this.onDataFrameChange}
            toggleDownloadForExcel={this.toggleDownloadForExcel}
          />
          <Button
            variant="primary"
            onClick={() => {
              if (hasLogs) {
                reportInteraction('grafana_logs_download_clicked', {
                  app,
                  format: 'csv',
                });
              }
              this.exportCsv(dataFrames[dataFrameIndex], { useExcelHeader: this.state.downloadForExcel });
            }}
            className={css`
              margin-bottom: 10px;
            `}
          >
            <Trans i18nKey="dashboard.inspect-data.download-csv">Download CSV</Trans>
          </Button>
          {hasLogs && (
            <Button
              variant="primary"
              onClick={this.exportLogsAsTxt}
              className={css`
                margin-bottom: 10px;
                margin-left: 10px;
              `}
            >
              <Trans i18nKey="dashboard.inspect-data.download-logs">Download logs</Trans>
            </Button>
          )}
          {hasTraces && (
            <Button
              variant="primary"
              onClick={this.exportTracesAsJson}
              className={css`
                margin-bottom: 10px;
                margin-left: 10px;
              `}
            >
              <Trans i18nKey="dashboard.inspect-data.download-traces">Download traces</Trans>
            </Button>
          )}
          {hasServiceGraph && (
            <Button
              variant="primary"
              onClick={this.exportServiceGraph}
              className={css`
                margin-bottom: 10px;
                margin-left: 10px;
              `}
            >
              <Trans i18nKey="dashboard.inspect-data.download-service">Download service graph</Trans>
            </Button>
          )}
        </div>
        <div className={styles.content}>
          <AutoSizer>
            {({ width, height }) => {
              if (width === 0) {
                return null;
              }

              return <Table width={width} height={height} data={dataFrame} showTypeIcons={true} />;
            }}
          </AutoSizer>
        </div>
      </div>
    );
  }
}

export function getProcessedData(options: GetDataOptions, data: DataFrame[], panel?: PanelModel): DataFrame[] {
  console.log('preProcessedDataIN', data);

  if (!options.withFieldConfig || !panel) {
    return applyRawFieldOverrides(data);
  }

  const fieldConfig = cleanTableConfigFromFieldConfig(panel.type, panel.fieldConfig);

  // We need to apply field config as it's not done by PanelQueryRunner (even when withFieldConfig is true).
  // It's because transformers create new fields and data frames, and we need to clean field config of any table settings.
  return applyFieldOverrides({
    data,
    theme: config.theme2,
    fieldConfig,
    replaceVariables: (value: string) => {
      return value;
    },
  });
}

// Because we visualize this data in a table we have to remove any custom table display settings
function cleanTableConfigFromFieldConfig(panelPluginId: string, fieldConfig: FieldConfigSource): FieldConfigSource {
  if (panelPluginId !== 'table') {
    return fieldConfig;
  }

  fieldConfig = cloneDeep(fieldConfig);
  // clear all table specific options
  fieldConfig.defaults.custom = {};

  // clear all table override properties
  for (const override of fieldConfig.overrides) {
    for (const prop of override.properties) {
      if (prop.id.startsWith('custom.')) {
        const index = override.properties.indexOf(prop);
        override.properties.slice(index, 1);
      }
    }
  }

  return fieldConfig;
}

function buildTransformationOptions() {
  const transformations: Array<SelectableValue<DataTransformerID>> = [
    {
      value: DataTransformerID.joinByField,
      label: t('dashboard.inspect-data.transformation', 'Series joined by time'),
      transformer: {
        id: DataTransformerID.joinByField,
        options: { byField: undefined }, // defaults to time field
      },
    },
  ];

  return transformations;
}
