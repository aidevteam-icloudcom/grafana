import { lastValueFrom } from 'rxjs';

import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { PromApplication, PromApiFeatures, PromBuildInfoResponse } from 'app/types/unified-alerting-dto';

import { RULER_NOT_SUPPORTED_MSG } from '../utils/constants';
import { getDataSourceByName } from '../utils/datasource';

import { fetchRules } from './prometheus';
import { fetchTestRulerRulesGroup } from './ruler';

/**
 * This function will attempt to detect what type of system we are talking to; this could be
 * Prometheus (vanilla) | Cortex | Mimir
 *
 * Cortex and Mimir allow editing rules via their API, Prometheus does not.
 * Prometheus and Mimir expose a `buildinfo` endpoint, Cortex does not.
 * Mimir reports which "features" are enabled or available via the buildinfo endpoint, Prometheus does not.
 */
export async function discoverDataSourceFeatures(dsSettings: {
  url: string;
  name: string;
  type: 'prometheus' | 'loki';
}): Promise<PromApiFeatures> {
  const { url, name, type } = dsSettings;

  // The current implementation of Loki's build info endpoint is useless
  // because it doesn't provide information about Loki's available features (e.g. Ruler API)
  // It's better to skip fetching it for Loki and go the Cortex path (manual discovery)
  const buildInfoResponse = type === 'prometheus' ? await fetchPromBuildInfo(url) : undefined;

  // check if the component returns buildinfo
  const hasBuildInfo = buildInfoResponse !== undefined;

  // we are dealing with a Cortex or Loki datasource since the response for buildinfo came up empty
  if (!hasBuildInfo) {
    // check if we can fetch rules via the prometheus compatible api
    const promRulesSupported = await hasPromRulesSupport(name);
    if (!promRulesSupported) {
      throw new Error(`Unable to fetch alert rules. Is the ${name} data source properly configured?`);
    }

    // check if the ruler is enabled
    const rulerSupported = await hasRulerSupport(name);

    return {
      application: PromApplication.Lotex,
      features: {
        rulerApiEnabled: rulerSupported,
      },
    };
  }

  // if no features are reported but buildinfo was return we're talking to Prometheus
  const { features } = buildInfoResponse.data;
  if (!features) {
    return {
      application: PromApplication.Prometheus,
      features: {
        rulerApiEnabled: false,
      },
    };
  }

  // if we have both features and buildinfo reported we're talking to Mimir
  return {
    application: PromApplication.Mimir,
    features: {
      rulerApiEnabled: features?.ruler_config_api === 'true',
    },
  };
}

/**
 * Attempt to fetch buildinfo from our component
 */
export async function discoverFeatures(dataSourceName: string): Promise<PromApiFeatures> {
  const dsConfig = getDataSourceByName(dataSourceName);
  if (!dsConfig) {
    throw new Error(`Cannot find data source configuration for ${dataSourceName}`);
  }
  const { url, name, type } = dsConfig;
  if (!url) {
    throw new Error(`The data souce url cannot be empty.`);
  }

  if (type !== 'prometheus' && type !== 'loki') {
    throw new Error(`The build info request is not available for ${type}. Only 'prometheus' and 'loki' are supported`);
  }

  return discoverDataSourceFeatures({ name, url, type });
}

async function fetchPromBuildInfo(url: string): Promise<PromBuildInfoResponse | undefined> {
  const response = await lastValueFrom(
    getBackendSrv().fetch<PromBuildInfoResponse>({
      url: `${url}/api/v1/status/buildinfo`,
      showErrorAlert: false,
      showSuccessAlert: false,
    })
  ).catch((e) => {
    if ('status' in e && e.status === 404) {
      return undefined; // Cortex does not support buildinfo endpoint, we return an empty response
    }

    throw e;
  });

  return response?.data;
}

/**
 * Check if the component allows us to fetch rules
 */
async function hasPromRulesSupport(dataSourceName: string) {
  try {
    await fetchRules(dataSourceName);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Attempt to check if the ruler API is enabled for Cortex, Prometheus does not support it and Mimir
 * reports this via the buildInfo "features"
 */
async function hasRulerSupport(dataSourceName: string) {
  try {
    await fetchTestRulerRulesGroup(dataSourceName);
    return true;
  } catch (e) {
    if (errorIndicatesMissingRulerSupport(e)) {
      return false;
    }
    throw e;
  }
}

// there errors indicate that the ruler API might be disabled or not supported for Cortex
function errorIndicatesMissingRulerSupport(error: any) {
  return (
    (isFetchError(error) &&
      (error.data.message?.includes('GetRuleGroup unsupported in rule local store') || // "local" rule storage
        error.data.message?.includes('page not found'))) || // ruler api disabled
    error.message?.includes('404 from rules config endpoint') || // ruler api disabled
    error.data.message?.includes(RULER_NOT_SUPPORTED_MSG) // ruler api not supported
  );
}
