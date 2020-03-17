import React, { ChangeEvent, FocusEvent, PureComponent } from 'react';
import { e2e } from '@grafana/e2e';

import { ConstantVariableModel } from '../../templating/variable';
import { VariableEditorProps } from '../editor/types';

export interface Props extends VariableEditorProps<ConstantVariableModel> {}

export class ConstantVariableEditor extends PureComponent<Props> {
  onChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onPropChange({
      propName: 'query',
      propValue: event.target.value,
    });
  };

  onBlur = (event: FocusEvent<HTMLInputElement>) => {
    this.props.onPropChange({
      propName: 'query',
      propValue: event.target.value,
      updateOptions: true,
    });
  };

  render() {
    return (
      <>
        <div className="gf-form-group">
          <h5 className="section-heading">Constant options</h5>
          <div className="gf-form">
            <span className="gf-form-label">Value</span>
            <input
              type="text"
              className="gf-form-input"
              value={this.props.variable.query}
              onChange={this.onChange}
              onBlur={this.onBlur}
              placeholder="your metric prefix"
              aria-label={
                e2e.pages.Dashboard.Settings.Variables.Edit.ConstantVariable.selectors.constantOptionsQueryInput
              }
            />
          </div>
        </div>
      </>
    );
  }
}
