import { Observable } from 'rxjs';

import { AbstractQuery, CoreApp, DataQueryRequest, DataQueryResponse, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

import { PyroscopeDataSourceOptions, ProfileTypeMessage, Query } from './types';

export abstract class PyroscopeDataSource extends DataSourceWithBackend<Query, PyroscopeDataSourceOptions> {
  abstract applyTemplateVariables(query: Query, scopedVars: ScopedVars): Query;
  abstract exportToAbstractQueries(queries: Query[]): Promise<AbstractQuery[]>;
  abstract exportToAbstractQuery(query: Query): AbstractQuery;
  abstract getAllProfileTypes(): Promise<ProfileTypeMessage[]>;
  abstract getDefaultQuery(app: CoreApp): Partial<Query>;
  abstract getLabelNames(query: string, start: number, end: number): Promise<string[]>;
  abstract getLabelValues(query: string, label: string, start: number, end: number): Promise<string[]>;
  abstract getProfileTypes(): Promise<ProfileTypeMessage[]>;
  abstract importFromAbstractQueries(abstractQueries: AbstractQuery[]): Promise<Query[]>;
  abstract importFromAbstractQuery(labelBasedQuery: AbstractQuery): Query;
  abstract query(request: DataQueryRequest<Query>): Observable<DataQueryResponse>;
}
