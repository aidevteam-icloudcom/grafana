import React, { useEffect, useMemo, useState } from 'react';
import pluralize from 'pluralize';
import { Icon, useStyles2 } from '@grafana/ui';
import { Alert, PromRuleWithLocation } from 'app/types/unified-alerting';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { css } from '@emotion/css';
import { GrafanaAlertState, PromAlertingRuleState } from 'app/types/unified-alerting-dto';
import { UnifiedAlertListOptions } from './types';
import { AlertInstancesTable } from 'app/features/alerting/unified/components/rules/AlertInstancesTable';
import { sortAlerts } from 'app/features/alerting/unified/utils/misc';

interface Props {
  ruleWithLocation: PromRuleWithLocation;
  options: PanelProps<UnifiedAlertListOptions>['options'];
}

export const AlertInstances = ({ ruleWithLocation, options }: Props) => {
  const { rule } = ruleWithLocation;
  const [displayInstances, setDisplayInstances] = useState<boolean>(options.showInstances);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    setDisplayInstances(options.showInstances);
  }, [options.showInstances]);

  const alerts = useMemo(
    (): Alert[] => (displayInstances ? filterAlerts(options, sortAlerts(options.sortOrder, rule.alerts)) : []),
    [rule, options, displayInstances]
  );

  return (
    <div>
      {rule.state !== PromAlertingRuleState.Inactive && (
        <div className={styles.instance} onClick={() => setDisplayInstances(!displayInstances)}>
          <Icon name={displayInstances ? 'angle-down' : 'angle-right'} size={'md'} />
          <span>{`${rule.alerts.length} ${pluralize('instance', rule.alerts.length)}`}</span>
        </div>
      )}

      {!!alerts.length && <AlertInstancesTable instances={alerts} />}
    </div>
  );
};

function filterAlerts(options: PanelProps<UnifiedAlertListOptions>['options'], alerts: Alert[]): Alert[] {
  let filteredAlerts = [...alerts];
  if (
    [Object.values(options.alertInstanceStateFilter), Object.values(options.stateFilter)].flat().some((value) => value)
  ) {
    filteredAlerts = filteredAlerts.filter((alert) => {
      return (
        (options.alertInstanceStateFilter.Alerting && alert.state === GrafanaAlertState.Alerting) ||
        (options.alertInstanceStateFilter.Pending && alert.state === GrafanaAlertState.Pending) ||
        (options.alertInstanceStateFilter.NoData && alert.state === GrafanaAlertState.NoData) ||
        (options.alertInstanceStateFilter.Normal && alert.state === GrafanaAlertState.Normal) ||
        (options.alertInstanceStateFilter.Error && alert.state === GrafanaAlertState.Error) ||
        (options.stateFilter.firing && alert.state === PromAlertingRuleState.Firing) ||
        (options.stateFilter.inactive && alert.state === PromAlertingRuleState.Inactive) ||
        (options.stateFilter.pending && alert.state === PromAlertingRuleState.Pending)
      );
    });
  }
  return filteredAlerts;
}

const getStyles = (_: GrafanaTheme2) => ({
  instance: css`
    cursor: pointer;
  `,
});
