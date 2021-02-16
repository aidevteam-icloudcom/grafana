import React, { PureComponent, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { StoreState } from 'app/types';
import { AdHocVariableFilter, AdHocVariableModel } from 'app/features/variables/types';
import { VariablePickerProps } from '../../pickers/types';
import { SelectableValue } from '@grafana/data';
import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { ConditionSegment } from './ConditionSegment';
import { addFilter, changeFilter, removeFilter } from '../actions';
import { REMOVE_FILTER_KEY } from './AdHocFilterKey';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';

const mapDispatchToProps = {
  addFilter,
  removeFilter,
  changeFilter,
};

const mapStateToProps = (state: StoreState) => ({});

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps extends VariablePickerProps<AdHocVariableModel> {}

type Props = OwnProps & ConnectedProps<typeof connector>;

export class AdHocPickerUnconnected extends PureComponent<Props> {
  onChange = (index: number, prop: string) => (key: SelectableValue<string>) => {
    const { id, filters } = this.props.variable;
    const { value } = key;

    if (key.value === REMOVE_FILTER_KEY) {
      return this.props.removeFilter(id, index);
    }

    return this.props.changeFilter(id, {
      index,
      filter: {
        ...filters[index],
        [prop]: value,
      },
    });
  };

  appendFilterToVariable = (filter: AdHocVariableFilter) => {
    const { id } = this.props.variable;
    this.props.addFilter(id, filter);
  };

  render() {
    const { filters } = this.props.variable;

    return (
      <div className="gf-form-inline">
        {this.renderFilters(filters)}
        <AdHocFilterBuilder
          datasource={this.props.variable.datasource!}
          appendBefore={filters.length > 0 ? <ConditionSegment label="AND" /> : null}
          onCompleted={this.appendFilterToVariable}
        />
      </div>
    );
  }

  renderFilters(filters: AdHocVariableFilter[]) {
    return filters.reduce((segments: ReactNode[], filter, index) => {
      if (segments.length > 0) {
        segments.push(<ConditionSegment label="AND" key={`condition-${index}`} />);
      }
      segments.push(this.renderFilterSegments(filter, index));
      return segments;
    }, []);
  }

  renderFilterSegments(filter: AdHocVariableFilter, index: number) {
    return (
      <React.Fragment key={`filter-${index}`}>
        <AdHocFilterRenderer
          datasource={this.props.variable.datasource!}
          filter={filter}
          onKeyChange={this.onChange(index, 'key')}
          onOperatorChange={this.onChange(index, 'operator')}
          onValueChange={this.onChange(index, 'value')}
        />
      </React.Fragment>
    );
  }
}

export const AdHocPicker = connector(AdHocPickerUnconnected);
AdHocPicker.displayName = 'AdHocPicker';
