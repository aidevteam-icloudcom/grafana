import { AlertmanagerAlert } from 'app/plugins/datasource/alertmanager/types';
import React, { FC, useState } from 'react';
import { CollapseToggle } from '../CollapseToggle';
import { StateTag } from '../StateTag';
import { ActionIcon } from '../rules/ActionIcon';
import { getAlertTableStyles } from '../../styles/table';
import { useStyles } from '@grafana/ui';
import { dateTimeAsMoment, toDuration } from '@grafana/data';
import { AlertLabels } from '../AlertLabels';

interface Props {
  alert: AlertmanagerAlert;
  className?: string;
}

export const SilencedAlertsTableRow: FC<Props> = ({ alert, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const tableStyles = useStyles(getAlertTableStyles);
  const alertDuration = toDuration(dateTimeAsMoment(alert.endsAt).diff(alert.startsAt)).humanize();
  const alertName = Object.entries(alert.labels).reduce((name, [labelKey, labelValue]) => {
    if (labelKey === 'alertname' || labelKey === '__alert_rule_title__') {
      name = labelValue;
    }
    return name;
  }, '');
  return (
    <>
      <tr className={className}>
        <td>
          <CollapseToggle isCollapsed={isCollapsed} onToggle={(collapsed) => setIsCollapsed(collapsed)} />
        </td>
        <td>
          <StateTag status={alert.status.state}>{alert.status.state}</StateTag>
        </td>
        <td>for {alertDuration}</td>
        <td>{alertName}</td>
        <td className={tableStyles.actionsCell}>
          <ActionIcon icon="chart-line" href={alert.generatorURL} tooltip="View in explorer" />
        </td>
      </tr>
      {!isCollapsed && (
        <tr className={className}>
          <td></td>
          <td colSpan={5}>
            <AlertLabels labels={alert.labels} />
          </td>
        </tr>
      )}
    </>
  );
};
