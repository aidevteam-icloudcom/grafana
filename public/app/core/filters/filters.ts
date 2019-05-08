import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import coreModule from '../core_module';
import { TemplateSrv } from 'app/features/templating/template_srv';

coreModule.filter('stringSort', () => {
  return (input: any) => {
    return input.sort();
  };
});

coreModule.filter('slice', () => {
  return (arr: any[], start: any, end: any) => {
    if (!_.isUndefined(arr)) {
      return arr.slice(start, end);
    }
    return arr;
  };
});

coreModule.filter('stringify', () => {
  return (arr: any[]) => {
    if (_.isObject(arr) && !_.isArray(arr)) {
      return angular.toJson(arr);
    } else {
      return _.isNull(arr) ? null : arr.toString();
    }
  };
});

coreModule.filter('moment', () => {
  return (date: string, mode: string) => {
    switch (mode) {
      case 'ago':
        return moment(date).fromNow();
    }
    return moment(date).fromNow();
  };
});

/** @ngInject */
function interpolateTemplateVars(templateSrv: TemplateSrv) {
  const filterFunc: any = (text: string, scope: any) => {
    let scopedVars;
    if (scope.ctrl) {
      scopedVars = {
        __interval: { text: scope.ctrl.interval, value: scope.ctrl.interval },
        __interval_ms: { text: scope.ctrl.intervalMs, value: scope.ctrl.intervalMs },
        ...(scope.ctrl.panel || scope.ctrl.row).scopedVars,
      };
    } else {
      scopedVars = scope.row.scopedVars;
    }

    return templateSrv.replaceWithText(text, scopedVars);
  };

  filterFunc.$stateful = true;
  return filterFunc;
}

coreModule.filter('interpolateTemplateVars', interpolateTemplateVars);
export default {};
