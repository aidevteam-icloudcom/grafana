import { lastValueFrom } from 'rxjs';

import { getBackendSrv } from '@grafana/runtime';
import { Matcher } from 'app/plugins/datasource/alertmanager/types';
import { RuleNamespace } from 'app/types/unified-alerting';
import { PromRulesResponse } from 'app/types/unified-alerting-dto';

import { getDatasourceAPIUid, GRAFANA_RULES_SOURCE_NAME } from '../utils/datasource';

export interface FetchPromRulesFilter {
  dashboardUID: string;
  panelId?: number;
}

export interface PrometheusDataSourceConfig {
  dataSourceName: string;
  limitAlerts?: number;
}

export function prometheusUrlBuilder(dataSourceConfig: PrometheusDataSourceConfig) {
  const { dataSourceName, limitAlerts } = dataSourceConfig;

  return {
    rules: (filter?: FetchPromRulesFilter) => {
      const searchParams = new URLSearchParams();

      // if we're fetching for Grafana managed rules, we should add a limit to the number of alert instances
      // we do this because the response is large otherwise and we don't show all of them in the UI anyway.
      if (dataSourceName === GRAFANA_RULES_SOURCE_NAME && limitAlerts) {
        searchParams.set('limit_alerts', String(limitAlerts));
      }

      const params = prepareRulesFilterQueryParams(searchParams, filter);

      return {
        url: `/api/prometheus/${getDatasourceAPIUid(dataSourceName)}/api/v1/rules`,
        params: params,
      };
    },
  };
}

export function prepareRulesFilterQueryParams(
  params: URLSearchParams,
  filter?: FetchPromRulesFilter
): Record<string, string> {
  if (filter?.dashboardUID) {
    params.set('dashboard_uid', filter.dashboardUID);
    if (filter?.panelId) {
      params.set('panel_id', String(filter.panelId));
    }
  }

  return Object.fromEntries(params);
}

export function paramsWithMatcherAndState(
  params: Record<string, string | string[]>,
  state?: string[],
  matchers?: Matcher[]
) {
  let paramsResult = { ...params };

  if (state?.length) {
    paramsResult = { ...paramsResult, state };
  }

  if (matchers?.length) {
    const matcherToJsonString: string[] = matchers.map((m) => JSON.stringify(m));
    paramsResult = {
      ...paramsResult,
      matcher: matcherToJsonString,
    };
  }

  return paramsResult;
}

export async function fetchRules(
  dataSourceName: string,
  filter?: FetchPromRulesFilter,
  limitAlerts?: number,
  matcher?: Matcher[],
  state?: string[]
): Promise<RuleNamespace[]> {
  if (filter?.dashboardUID && dataSourceName !== GRAFANA_RULES_SOURCE_NAME) {
    throw new Error('Filtering by dashboard UID is only supported for Grafana Managed rules.');
  }

  const { url, params } = prometheusUrlBuilder({ dataSourceName, limitAlerts }).rules(filter);

  // adding state param here instead of adding it in prometheusUrlBuilder, for being a possible multiple query param
  const response = await lastValueFrom(
    getBackendSrv().fetch<PromRulesResponse>({
      url,
      params: paramsWithMatcherAndState(params, state, matcher),
      showErrorAlert: false,
      showSuccessAlert: false,
    })
  ).catch((e) => {
    if ('status' in e && e.status === 404) {
      throw new Error('404 from rule state endpoint. Perhaps ruler API is not enabled?');
    }
    throw e;
  });

  const nsMap: { [key: string]: RuleNamespace } = {};
  response.data.data.groups.forEach((group) => {
    group.rules.forEach((rule) => {
      rule.query = rule.query || '';
    });
    if (!nsMap[group.file]) {
      nsMap[group.file] = {
        dataSourceName,
        name: group.file,
        groups: [group],
      };
    } else {
      nsMap[group.file].groups.push(group);
    }
  });

  return Object.values(nsMap);
}
