import { last, times } from 'lodash';
import React from 'react';

import { config } from '@grafana/runtime';
import { Button, Stack } from '@grafana/ui';

import { formatPrometheusDuration, parsePrometheusDuration, safeParsePrometheusDuration } from '../../utils/time';

export const getEvaluationGroupOptions = (minInterval = '10s') => {
  const MIN_OPTIONS_TO_SHOW = 8;
  const DEFAULT_INTERVAL_OPTIONS: number[] = [
    parsePrometheusDuration('10s'),
    parsePrometheusDuration('30s'),
    parsePrometheusDuration('1m'),
    parsePrometheusDuration('5m'),
    parsePrometheusDuration('10m'),
    parsePrometheusDuration('15m'),
    parsePrometheusDuration('30m'),
    parsePrometheusDuration('1h'),
  ];

  // 10s for OSS and 1m0s for Grafana Cloud
  const minEvaluationIntervalMillis = safeParsePrometheusDuration(minInterval);

  /**
   * 1. make sure we always show at least 8 options to the user
   * 2. find the default interval closest to the configured minInterval
   * 3. if we have fewer than 8 options, we basically double the last interval until we have 8 options
   */
  const head = DEFAULT_INTERVAL_OPTIONS.filter((millis) => minEvaluationIntervalMillis <= millis);

  const tail = times(MIN_OPTIONS_TO_SHOW - head.length, (index: number) => {
    const lastInterval = last(head) ?? minEvaluationIntervalMillis;
    const multiplier = head.length === 0 ? 1 : 2; // if the head is empty we start with the min interval and multiply it only once :)
    return lastInterval * multiplier * (index + 1);
  });

  return [...head, ...tail].map(formatPrometheusDuration);
};

const QUICK_PICK_OPTIONS = getEvaluationGroupOptions(config.unifiedAlerting.minInterval);

interface Props {
  currentInterval: string;
  onSelect: (interval: string) => void;
}

/**
 * Allow a quick selection of group evaluation intervals, based on the configured "unifiedAlerting.minInterval" value
 * ie. [1m, 2m, 5m, 10m, 15m] etc.
 */
export function EvaluationGroupQuickPick({ currentInterval, onSelect }: Props) {
  const isQuickSelectionActive = (interval: string) => {
    return currentInterval ? currentInterval === interval : false;
  };

  return (
    <Stack direction="row" gap={0.5} role="listbox">
      {QUICK_PICK_OPTIONS.map((interval) => (
        <Button
          role="option"
          aria-selected={isQuickSelectionActive(interval)}
          key={interval}
          variant={isQuickSelectionActive(interval) ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            onSelect(interval);
          }}
        >
          {interval}
        </Button>
      ))}
    </Stack>
  );
}
