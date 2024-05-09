import React from 'react';

import { LinkButton, ButtonVariant } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
// @todo: replace barrel import path
import { Trans } from 'app/core/internationalization/index';
import { ROUTES as CONNECTIONS_ROUTES } from 'app/features/connections/constants';
// @todo: replace barrel import path
import { AccessControlAction } from 'app/types/index';

interface AddNewDataSourceButtonProps {
  onClick?: () => void;
  variant?: ButtonVariant;
}

export function AddNewDataSourceButton({ variant, onClick }: AddNewDataSourceButtonProps) {
  const hasCreateRights = contextSrv.hasPermission(AccessControlAction.DataSourcesCreate);
  const newDataSourceURL = CONNECTIONS_ROUTES.DataSourcesNew;

  return (
    <LinkButton
      variant={variant || 'primary'}
      href={newDataSourceURL}
      disabled={!hasCreateRights}
      tooltip={!hasCreateRights ? 'You do not have permission to configure new data sources' : undefined}
      onClick={onClick}
      target="_blank"
    >
      <Trans i18nKey="data-source-picker.add-new-data-source">Configure a new data source</Trans>
    </LinkButton>
  );
}
