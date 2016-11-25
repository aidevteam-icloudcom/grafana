///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import {Variable, assignModelProperties, variableTypes} from './variable';
import {VariableSrv} from './variable_srv';

export class DatasourceVariable implements Variable {
  regex: any;
  query: string;
  options: any;
  current: any;
  refresh: any;

 defaults = {
    type: 'datasource',
    name: '',
    hide: 0,
    label: '',
    current: {},
    regex: '',
    options: [],
    query: '',
    refresh: 1,
  };

  /** @ngInject **/
  constructor(private model, private datasourceSrv, private variableSrv) {
    assignModelProperties(this, model, this.defaults);
    this.refresh = 1;
  }

  getSaveModel() {
    assignModelProperties(this.model, this, this.defaults);

    // dont persist options
    this.model.options = [];
    return this.model;
  }

  setValue(option) {
    return this.variableSrv.setOptionAsCurrent(this, option);
  }

  updateOptions() {
    var options = [];
    var sources = this.datasourceSrv.getMetricSources({skipVariables: true});
    var regex;

    if (this.regex) {
      regex = kbn.stringToJsRegex(this.regex);
    }

    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];
      // must match on type
      if (source.meta.id !== this.query) {
        continue;
      }

      if (regex && !regex.exec(source.name)) {
        continue;
      }

      options.push({text: source.name, value: source.name});
    }

    if (options.length === 0) {
      options.push({text: 'No data sources found', value: ''});
    }

    this.options = options;
    return this.variableSrv.validateVariableSelectionState(this);
  }

  dependsOn(variable) {
    return false;
  }

  setValueFromUrl(urlValue) {
    return this.variableSrv.setOptionFromUrl(this, urlValue);
  }

  getValueForUrl() {
    return this.current.value;
  }
}

variableTypes['datasource'] = {
  name: 'Datasource',
  ctor: DatasourceVariable,
  description: 'Enabled you to dynamically switch the datasource for multiple panels',
};
