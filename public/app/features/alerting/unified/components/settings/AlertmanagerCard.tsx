import { capitalize } from 'lodash';
import React from 'react';

import { Badge, Button, Card, Stack, Text, TextLink } from '@grafana/ui';

import { ConnectionStatus } from '../../hooks/useExternalAmSelector';
import { ProvisioningBadge } from '../Provisioning';
import { WithReturnButton } from '../WithReturnButton';

import { BUILTIN_ALERTMANAGER_NAME } from './InternalAlertmanager';

interface Props {
  name: string;
  href?: string;
  url?: string;
  logo?: string;
  provisioned?: boolean;
  readOnly?: boolean;
  forwardingDisabled?: boolean;
  implementation?: string;
  receiving?: boolean;
  status?: ConnectionStatus;
  // functions
  onEditConfiguration: () => void;
  onDisable: () => void;
  onEnable: () => void;
}

export function AlertmanagerCard({
  name,
  href,
  url,
  logo = 'public/app/plugins/datasource/alertmanager/img/logo.svg',
  provisioned = false,
  readOnly = provisioned,
  forwardingDisabled = false,
  implementation,
  receiving = false,
  status = 'unknown',
  onEditConfiguration,
  onEnable,
  onDisable,
}: Props) {
  const showEnableDisable = !provisioned && !forwardingDisabled;
  // @TODO this isn't really the best way to do it – but needs some backend changes to determine the "canonical" Alertmanager.
  const isCanonicalAlertmanager = name === BUILTIN_ALERTMANAGER_NAME;

  return (
    <Card data-testid={`alertmanager-card-${name}`}>
      <Card.Heading>
        <Stack alignItems="center" gap={1}>
          {href ? (
            <WithReturnButton title="Alerting settings" component={<TextLink href={href}>{name}</TextLink>} />
          ) : (
            name
          )}
          {provisioned && <ProvisioningBadge />}
        </Stack>
      </Card.Heading>
      <Card.Figure>
        <img alt={`logo for ${name}`} src={logo} />
      </Card.Figure>

      {/* sadly we have to resort to "mimicking" the Card.Description in here because "<div>"s can not be child elements of "<p>" – which is what the description element wrapper is */}
      <Card.Meta>
        <Stack direction="column" gap={1} alignItems="flex-start">
          <Card.Meta>
            {implementation && capitalize(implementation)}
            {url && url}
          </Card.Meta>
          {/* if forwarding is diabled, still show status for the "canonical" Alertmanager */}
          {forwardingDisabled && isCanonicalAlertmanager && (
            <Badge text="Receiving Grafana-managed alerts" color="green" />
          )}
          {forwardingDisabled ? null : (
            <>
              {!receiving ? (
                <Text variant="bodySmall">Not receiving Grafana managed alerts</Text>
              ) : (
                <>
                  {status === 'pending' && <Badge text="Activation in progress" color="orange" />}
                  {status === 'active' && <Badge text="Receiving Grafana-managed alerts" color="green" />}
                  {status === 'dropped' && <Badge text="Failed to adopt Alertmanager" color="red" />}
                  {status === 'inconclusive' && <Badge text="Inconclusive" color="orange" />}
                </>
              )}
            </>
          )}
        </Stack>
      </Card.Meta>

      {/* we'll use the "tags" area to append buttons and actions */}
      <Card.Tags>
        <Stack direction="row" gap={1}>
          {/* ⚠️ provisioned Data sources cannot have their "enable" / "disable" actions but we should still allow editing of the configuration */}
          <Button onClick={onEditConfiguration} icon={readOnly ? 'eye' : 'edit'} variant="secondary" fill="outline">
            {readOnly ? 'View configuration' : 'Edit configuration'}
          </Button>
          {showEnableDisable ? (
            <>
              {receiving ? (
                <Button icon="times" variant="destructive" fill="outline" onClick={onDisable}>
                  Disable
                </Button>
              ) : (
                <Button icon="check" variant="secondary" fill="outline" onClick={onEnable}>
                  Enable
                </Button>
              )}
            </>
          ) : null}
        </Stack>
      </Card.Tags>
    </Card>
  );
}
