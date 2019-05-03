// Libraries
import React, { PureComponent } from 'react';

import { DataSourcePluginOptionsEditorProps } from '@grafana/ui';

type Props = DataSourcePluginOptionsEditorProps<any>;

/**
 * Empty Config Editor -- settings to save
 */
export class ConfigEditor extends PureComponent<Props> {
  render() {
    return <div />;
  }
}
