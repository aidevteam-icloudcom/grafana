import React, { ChangeEvent, FormEvent, PureComponent } from 'react';
import isEqual from 'lodash/isEqual';
import { AppEvents, LoadingState, SelectableValue, VariableType } from '@grafana/data';
import { Button, Icon, InlineFieldRow, VerticalGroup } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';

import { variableAdapters } from '../adapters';
import { NEW_VARIABLE_ID, toVariableIdentifier, toVariablePayload, VariableIdentifier } from '../state/types';
import { VariableHide, VariableModel } from '../types';
import { appEvents } from '../../../core/core';
import { VariableValuesPreview } from './VariableValuesPreview';
import { changeVariableName, onEditorAdd, onEditorUpdate, variableEditorMount, variableEditorUnMount } from './actions';
import { MapDispatchToProps, MapStateToProps } from 'react-redux';
import { StoreState } from '../../../types';
import { VariableEditorState } from './reducer';
import { getVariable } from '../state/selectors';
import { connectWithStore } from '../../../core/utils/connectWithReduxStore';
import { OnPropChangeArguments } from './types';
import { changeVariableProp, changeVariableType } from '../state/sharedReducer';
import { updateOptions } from '../state/actions';
import { VariableTextField } from './VariableTextField';
import { VariableSelectField } from './VariableSelectField';
import { VariableSectionHeader } from './VariableSectionHeader';
import { hasOptions } from '../guard';

export interface OwnProps {
  identifier: VariableIdentifier;
}

interface ConnectedProps {
  editor: VariableEditorState;
  variable: VariableModel;
}

interface DispatchProps {
  variableEditorMount: typeof variableEditorMount;
  variableEditorUnMount: typeof variableEditorUnMount;
  changeVariableName: typeof changeVariableName;
  changeVariableProp: typeof changeVariableProp;
  onEditorUpdate: typeof onEditorUpdate;
  onEditorAdd: typeof onEditorAdd;
  changeVariableType: typeof changeVariableType;
  updateOptions: typeof updateOptions;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

export class VariableEditorEditorUnConnected extends PureComponent<Props> {
  componentDidMount(): void {
    this.props.variableEditorMount(this.props.identifier);
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
    if (!isEqual(prevProps.editor.errors, this.props.editor.errors)) {
      Object.values(this.props.editor.errors).forEach(error => {
        appEvents.emit(AppEvents.alertWarning, ['Validation', error]);
      });
    }
  }

  componentWillUnmount(): void {
    this.props.variableEditorUnMount(this.props.identifier);
  }

  onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    this.props.changeVariableName(this.props.identifier, event.target.value);
  };

  onTypeChange = (option: SelectableValue<VariableType>) => {
    if (!option.value) {
      return;
    }
    this.props.changeVariableType(toVariablePayload(this.props.identifier, { newType: option.value }));
  };

  onLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    this.props.changeVariableProp(
      toVariablePayload(this.props.identifier, { propName: 'label', propValue: event.target.value })
    );
  };

  onDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.props.changeVariableProp(
      toVariablePayload(this.props.identifier, { propName: 'description', propValue: event.target.value })
    );
  };

  onHideChange = (option: SelectableValue<VariableHide>) => {
    this.props.changeVariableProp(
      toVariablePayload(this.props.identifier, {
        propName: 'hide',
        propValue: option.value,
      })
    );
  };

  onPropChanged = async ({ propName, propValue, updateOptions = false }: OnPropChangeArguments) => {
    this.props.changeVariableProp(toVariablePayload(this.props.identifier, { propName, propValue }));
    if (updateOptions) {
      await this.props.updateOptions(toVariableIdentifier(this.props.variable));
    }
  };

  onHandleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!this.props.editor.isValid) {
      return;
    }

    if (this.props.variable.id !== NEW_VARIABLE_ID) {
      await this.props.onEditorUpdate(this.props.identifier);
    }

    if (this.props.variable.id === NEW_VARIABLE_ID) {
      await this.props.onEditorAdd(this.props.identifier);
    }
  };

  render() {
    const { variable } = this.props;
    const EditorToRender = variableAdapters.get(this.props.variable.type).editor;
    if (!EditorToRender) {
      return null;
    }
    const newVariable = this.props.variable.id && this.props.variable.id === NEW_VARIABLE_ID;
    const loading = variable.state === LoadingState.Loading;
    const typeOptions = variableAdapters.list().map(({ id, name }) => ({ label: name, value: id }));
    const typeValue = typeOptions.find(o => o.value === this.props.variable.type) ?? { label: 'Query', value: 'query' };
    const typeTooltip = variableAdapters.get(this.props.variable.type).description;
    const hideOptions = [
      { label: '', value: VariableHide.dontHide },
      { label: 'Label', value: VariableHide.hideLabel },
      { label: 'Variable', value: VariableHide.hideVariable },
    ];
    const hideValue = hideOptions.find(o => o.value === variable.hide) ?? hideOptions[0];

    return (
      <div>
        <form aria-label="Variable editor Form" onSubmit={this.onHandleSubmit}>
          <VerticalGroup spacing="lg">
            <VerticalGroup spacing="none">
              <VariableSectionHeader name="General" />
              <InlineFieldRow>
                <VariableTextField
                  value={this.props.editor.name}
                  onChange={this.onNameChange}
                  name="Name"
                  placeholder="name"
                  required
                  ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.General.generalNameInput}
                />
                <VariableSelectField
                  name="Type"
                  value={typeValue}
                  options={typeOptions}
                  onChange={this.onTypeChange}
                  tooltip={typeTooltip}
                  ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.General.generalTypeSelect}
                />
              </InlineFieldRow>

              {this.props.editor.errors.name && (
                <div className="gf-form">
                  <span className="gf-form-label gf-form-label--error">{this.props.editor.errors.name}</span>
                </div>
              )}

              <InlineFieldRow>
                <VariableTextField
                  value={this.props.variable.label ?? ''}
                  onChange={this.onLabelChange}
                  name="Label"
                  placeholder="optional display name"
                  ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.General.generalLabelInput}
                />
                <VariableSelectField
                  name="Hide"
                  value={hideValue}
                  options={hideOptions}
                  onChange={this.onHideChange}
                  ariaLabel={selectors.pages.Dashboard.Settings.Variables.Edit.General.generalHideSelect}
                />
              </InlineFieldRow>

              <VariableTextField
                name="Description"
                value={variable.description ?? ''}
                placeholder="descriptive text"
                onChange={this.onDescriptionChange}
                grow
              />
            </VerticalGroup>

            {EditorToRender && <EditorToRender variable={this.props.variable} onPropChange={this.onPropChanged} />}

            {hasOptions(this.props.variable) ? <VariableValuesPreview variable={this.props.variable} /> : null}

            <VerticalGroup spacing="none">
              <Button
                type="submit"
                aria-label={selectors.pages.Dashboard.Settings.Variables.Edit.General.submitButton}
                disabled={loading}
              >
                {newVariable ? 'Add' : 'Update'}
                {loading ? (
                  <Icon className="spin-clockwise" name="sync" size="sm" style={{ marginLeft: '2px' }} />
                ) : null}
              </Button>
            </VerticalGroup>
          </VerticalGroup>
        </form>
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state, ownProps) => ({
  editor: state.templating.editor,
  variable: getVariable(ownProps.identifier.id, state, false), // we could be renaming a variable and we don't want this to throw
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  variableEditorMount,
  variableEditorUnMount,
  changeVariableName,
  changeVariableProp,
  onEditorUpdate,
  onEditorAdd,
  changeVariableType,
  updateOptions,
};

export const VariableEditorEditor = connectWithStore(
  VariableEditorEditorUnConnected,
  mapStateToProps,
  mapDispatchToProps
);
