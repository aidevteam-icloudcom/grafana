// Libraries
import React, { PureComponent } from 'react';

// Types
import { PluginConfigTabProps, AppMeta } from '@grafana/ui';

interface Props extends PluginConfigTabProps<AppMeta, any> {}

export class ExampleTab2 extends PureComponent<Props> {
  constructor(props: Props) {
    super(props);

    console.log('ExampleTab2', this);
  }

  render() {
    const { meta } = this.props;

    return <div>ExampleTab22222222222222: {meta.name}</div>;
  }
}
