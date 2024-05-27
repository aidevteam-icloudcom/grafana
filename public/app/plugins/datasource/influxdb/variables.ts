import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { CustomVariableSupport, DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { InfluxVariableEditor } from './components/editor/variable/VariableQueryEditor';
import InfluxDatasource from './datasource';
import { InfluxVariableQuery } from './types';

export class InfluxVariableSupport extends CustomVariableSupport<InfluxDatasource> {
  editor = InfluxVariableEditor;

  constructor(
    private readonly datasource: InfluxDatasource,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super();
  }

  query(request: DataQueryRequest<InfluxVariableQuery>): Observable<DataQueryResponse> {
    let query: string | undefined;
    if (typeof request.targets[0] === 'string') {
      query = request.targets[0];
    } else {
      query = request.targets[0].query;
    }

    if (!query) {
      return of({ data: [] });
    }

    const interpolated = this.templateSrv.replace(query, request.scopedVars, this.datasource.interpolateQueryExpr);
    const metricFindStream = from(this.datasource.metricFindQuery(interpolated, request.range));
    return metricFindStream.pipe(map((results) => ({ data: results })));
  }
}
