import React from 'react';
import { Input } from '@grafana/ui';

import { TemplateSrv } from 'app/features/templating/template_srv';
import { SelectableValue } from '@grafana/data';

import StackdriverDatasource from '../datasource';
import { Metrics, Filters, AnnotationsHelp, Project } from './';
import { toOption } from '../functions';
import { AnnotationTarget, MetricDescriptor } from '../types';

export interface Props {
  onQueryChange: (target: AnnotationTarget) => void;
  target: AnnotationTarget;
  datasource: StackdriverDatasource;
  templateSrv: TemplateSrv;
}

interface State extends AnnotationTarget {
  variableOptionGroup: SelectableValue<string>;
  variableOptions: Array<SelectableValue<string>>;
  labels: any;
  [key: string]: any;
}

const DefaultTarget: State = {
  projectName: '',
  projects: [],
  metricType: '',
  filters: [],
  metricKind: '',
  valueType: '',
  refId: 'annotationQuery',
  title: '',
  text: '',
  labels: {},
  variableOptionGroup: {},
  variableOptions: [],
};

export class AnnotationQueryEditor extends React.Component<Props, State> {
  state: State = DefaultTarget;

  async componentDidMount() {
    const { target, datasource } = this.props;
    if (!target.projectName) {
      target.projectName = datasource.getDefaultProject();
    }

    const variableOptionGroup = {
      label: 'Template Variables',
      options: datasource.variables.map(toOption),
    };

    const projects = await datasource.getProjects();
    this.setState({
      variableOptionGroup,
      variableOptions: variableOptionGroup.options,
      ...target,
      projects,
    });

    datasource.getLabels(target.metricType, target.projectName, target.refId).then(labels => this.setState({ labels }));
  }

  onMetricTypeChange = ({ valueType, metricKind, type, unit }: MetricDescriptor) => {
    const { onQueryChange, datasource } = this.props;
    this.setState(
      {
        metricType: type,
        unit,
        valueType,
        metricKind,
      },
      () => {
        onQueryChange(this.state);
      }
    );
    datasource.getLabels(type, this.state.refId, this.state.projectName).then(labels => this.setState({ labels }));
  };

  onChange(prop: string, value: string | string[]) {
    this.setState({ [prop]: value }, () => {
      this.props.onQueryChange(this.state);
    });
  }

  render() {
    const { projectName, metricType, filters, title, text, variableOptionGroup, labels, variableOptions } = this.state;
    const { datasource } = this.props;

    return (
      <>
        <Project
          templateVariableOptions={variableOptions}
          datasource={datasource}
          projectName={projectName || datasource.getDefaultProject()}
          onChange={value => this.onChange('projectName', value)}
        />
        <Metrics
          projectName={projectName}
          metricType={metricType}
          templateSrv={datasource.templateSrv}
          datasource={datasource}
          templateVariableOptions={variableOptions}
          onChange={metric => this.onMetricTypeChange(metric)}
        >
          {metric => (
            <>
              <Filters
                labels={labels}
                filters={filters}
                onChange={value => this.onChange('filters', value)}
                variableOptionGroup={variableOptionGroup}
              />
            </>
          )}
        </Metrics>
        <div className="gf-form gf-form-inline">
          <div className="gf-form">
            <span className="gf-form-label query-keyword width-9">Title</span>
            <Input
              type="text"
              className="gf-form-input width-20"
              value={title}
              onChange={e => this.onChange('title', e.target.value)}
            />
          </div>
          <div className="gf-form">
            <span className="gf-form-label query-keyword width-9">Text</span>
            <Input
              type="text"
              className="gf-form-input width-20"
              value={text}
              onChange={e => this.onChange('text', e.target.value)}
            />
          </div>
          <div className="gf-form gf-form--grow">
            <div className="gf-form-label gf-form-label--grow" />
          </div>
        </div>

        <AnnotationsHelp />
      </>
    );
  }
}
