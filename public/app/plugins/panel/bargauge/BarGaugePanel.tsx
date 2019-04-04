// Libraries
import React, { PureComponent } from 'react';

// Services & Utils
import { config } from 'app/core/config';

// Components
import { BarGauge, VizRepeater, getSingleStatDisplayValues } from '@grafana/ui/src/components';

// Types
import { BarGaugeOptions } from './types';
import { PanelProps, DisplayValue } from '@grafana/ui/src/types';

export class BarGaugePanel extends PureComponent<PanelProps<BarGaugeOptions>> {
  renderValue = (value: DisplayValue, width: number, height: number): JSX.Element => {
    const { options } = this.props;

    return (
      <BarGauge
        value={value}
        width={width}
        height={height}
        orientation={options.orientation}
        thresholds={options.thresholds}
        theme={config.theme}
        outerMargin={this.getMargin()}
        displayMode={options.displayMode}
      />
    );
  };

  getValues = (): DisplayValue[] => {
    return getSingleStatDisplayValues({
      valueMappings: this.props.options.valueMappings,
      thresholds: this.props.options.thresholds,
      valueOptions: this.props.options.valueOptions,
      data: this.props.data,
      theme: config.theme,
      replaceVariables: this.props.replaceVariables,
    });
  };

  getMargin(): number {
    if (this.props.options.displayMode === 'lcd') {
      return 2;
    }

    return 10;
  }

  render() {
    const { height, width, options, data, renderCounter } = this.props;
    return (
      <VizRepeater
        margin={this.getMargin()}
        getValues={this.getValues}
        renderValue={this.renderValue}
        width={width}
        height={height}
        source={data}
        renderCounter={renderCounter}
        orientation={options.orientation}
      />
    );
  }
}
