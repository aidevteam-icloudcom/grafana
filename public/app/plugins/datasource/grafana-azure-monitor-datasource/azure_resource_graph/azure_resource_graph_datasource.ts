// eslint-disable-next-line lodash/import-scope
import _ from 'lodash';
import { AzureMonitorQuery, AzureDataSourceJsonData, AzureQueryType } from '../types';
import { ScopedVars } from '@grafana/data';
import { getTemplateSrv, DataSourceWithBackend } from '@grafana/runtime';

export default class AzureResourceGraphDatasource extends DataSourceWithBackend<
  AzureMonitorQuery,
  AzureDataSourceJsonData
> {
  filterQuery(item: AzureMonitorQuery): boolean {
    return !!item.azureResourceGraph?.query;
  }

  applyTemplateVariables(target: AzureMonitorQuery, scopedVars: ScopedVars): AzureMonitorQuery {
    const item = target.azureResourceGraph;
    if (!item) {
      return target;
    }

    const templateSrv = getTemplateSrv();
    const variableNames = templateSrv.getVariables().map((v) => `$${v.name}`);
    const subscriptionVar = _.find(target.subscriptions, (sub) => _.includes(variableNames, sub));
    const interpolatedSubscriptions = templateSrv
      .replace(subscriptionVar, scopedVars, this.interpolateVariable)
      .split(',')
      .filter((v) => v.length > 0);
    const subscriptions = [
      ...interpolatedSubscriptions,
      ..._.filter(target.subscriptions, (sub) => !_.includes(variableNames, sub)),
    ];
    const query = templateSrv.replace(item.query, scopedVars, this.interpolateVariable);

    return {
      refId: target.refId,
      queryType: AzureQueryType.AzureResourceGraph,
      subscriptions,
      azureResourceGraph: {
        resultFormat: 'table',
        query,
      },
    };
  }

  interpolateVariable(value: string, variable: { multi: any; includeAll: any }) {
    if (typeof value === 'string') {
      if (variable.multi || variable.includeAll) {
        return "'" + value + "'";
      } else {
        return value;
      }
    }

    if (typeof value === 'number' || Array.isArray(value)) {
      return value;
    }

    const quotedValues = _.map(value, (val) => {
      if (typeof value === 'number') {
        return value;
      }

      return "'" + val + "'";
    });
    return quotedValues.join(',');
  }
}
