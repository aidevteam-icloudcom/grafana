import { css, cx } from '@emotion/css';
import pluralize from 'pluralize';
import React, { useEffect } from 'react';
import { connect, ConnectedProps, useDispatch } from 'react-redux';

import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { ConfirmModal, FilterInput, Icon, LinkButton, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import Page from 'app/core/components/Page/Page';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { contextSrv } from 'app/core/core';
import { getNavModel } from 'app/core/selectors/navModel';
import { StoreState, ServiceAccountDTO, AccessControlAction, ServiceAccountStateFilter } from 'app/types';

import ServiceAccountListItem from './ServiceAccountsListItem';
import {
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  removeServiceAccount,
  updateServiceAccount,
  setServiceAccountToRemove,
  changeStateFilter,
} from './state/actions';

interface OwnProps {}

type Props = OwnProps & ConnectedProps<typeof connector>;

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'serviceaccounts'),
    ...state.serviceAccounts,
  };
}

const connector = connect(mapStateToProps);

const ServiceAccountsListPageUnconnected = ({
  navModel,
  serviceAccounts,
  isLoading,
  roleOptions,
  builtInRoles,
  query,
  serviceAccountStateFilter,
  serviceAccountToRemove,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    dispatch(fetchServiceAccounts());
    if (contextSrv.licensedAccessControlEnabled()) {
      dispatch(fetchACOptions());
    }
  }, [dispatch]);

  const noServiceAccountsCreated =
    serviceAccounts.length === 0 && serviceAccountStateFilter === ServiceAccountStateFilter.All && !query;

  const onRoleChange = async (role: OrgRole, serviceAccount: ServiceAccountDTO) => {
    const updatedServiceAccount = { ...serviceAccount, role: role };
    await dispatch(updateServiceAccount(updatedServiceAccount));
    await dispatch(fetchServiceAccounts());
  };

  const onQueryChange = (value: string) => {
    dispatch(changeQuery(value));
  };

  const onStateFilterChange = (value: ServiceAccountStateFilter) => {
    dispatch(changeStateFilter(value));
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <div className={styles.pageHeader}>
          <h2>Service accounts</h2>
          <div className={styles.apiKeyInfoLabel}>
            <Tooltip
              placement="bottom"
              interactive
              content={
                <>
                  API keys are now service Accounts with tokens. <a href="">Read more</a>
                </>
              }
            >
              <Icon name="question-circle" />
            </Tooltip>
            <span>Looking for API keys?</span>
          </div>
          {!noServiceAccountsCreated && contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate) && (
            <LinkButton href="org/serviceaccounts/create" variant="primary">
              Add service account
            </LinkButton>
          )}
        </div>
        <div className={styles.filterRow}>
          <FilterInput
            placeholder="Search service account by name"
            autoFocus={true}
            value={query}
            onChange={onQueryChange}
            width={50}
          />
          <div className={styles.filterDelimiter}></div>
          <RadioButtonGroup
            options={[
              { label: 'All', value: ServiceAccountStateFilter.All },
              { label: 'With expiring tokens', value: ServiceAccountStateFilter.WithExpiredTokens },
              { label: 'Disabled', value: ServiceAccountStateFilter.Disabled },
            ]}
            onChange={onStateFilterChange}
            value={serviceAccountStateFilter}
            className={styles.filter}
          />
        </div>
        {isLoading && <PageLoader />}
        {!isLoading && noServiceAccountsCreated && (
          <>
            <EmptyListCTA
              title="You haven't created any service accounts yet."
              buttonIcon="key-skeleton-alt"
              buttonLink="org/serviceaccounts/create"
              buttonTitle="Add service account"
              buttonDisabled={!contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate)}
              proTip="Remember, you can provide specific permissions for API access to other applications."
              proTipLink=""
              proTipLinkTitle=""
              proTipTarget="_blank"
            />
          </>
        )}

        <>
          <div className={cx(styles.table, 'admin-list-table')}>
            <table className="filter-table form-inline filter-table--hover">
              <thead>
                <tr>
                  <th></th>
                  <th>Account</th>
                  <th>ID</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th style={{ width: '34px' }} />
                </tr>
              </thead>
              <tbody>
                {!isLoading &&
                  serviceAccounts.length !== 0 &&
                  serviceAccounts.map((serviceAccount: ServiceAccountDTO) => (
                    <ServiceAccountListItem
                      serviceAccount={serviceAccount}
                      key={serviceAccount.id}
                      builtInRoles={builtInRoles}
                      roleOptions={roleOptions}
                      onRoleChange={onRoleChange}
                      onSetToRemove={setServiceAccountToRemove}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </>
        {serviceAccountToRemove && (
          <ConfirmModal
            body={
              <div>
                Are you sure you want to delete &apos;{serviceAccountToRemove.name}&apos;
                {Boolean(serviceAccountToRemove.tokens) &&
                  ` and ${serviceAccountToRemove.tokens} accompanying ${pluralize(
                    'token',
                    serviceAccountToRemove.tokens
                  )}`}
                ?
              </div>
            }
            confirmText="Delete"
            title="Delete service account"
            onDismiss={() => {
              setServiceAccountToRemove(null);
            }}
            isOpen={true}
            onConfirm={() => {
              removeServiceAccount(serviceAccountToRemove.id);
              setServiceAccountToRemove(null);
            }}
          />
        )}
      </Page.Contents>
    </Page>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      margin-top: ${theme.spacing(3)};
    `,
    filter: css`
      margin: 0 ${theme.spacing(1)};
    `,
    row: css`
      display: flex;
      align-items: center;
      height: 100% !important;

      a {
        padding: ${theme.spacing(0.5)} 0 !important;
      }
    `,
    unitTooltip: css`
      display: flex;
      flex-direction: column;
    `,
    unitItem: css`
      cursor: pointer;
      padding: ${theme.spacing(0.5)} 0;
      margin-right: ${theme.spacing(1)};
    `,
    disabled: css`
      color: ${theme.colors.text.disabled};
    `,
    link: css`
      color: inherit;
      cursor: pointer;
      text-decoration: underline;
    `,
    pageHeader: css`
      display: flex;
      margin-bottom: ${theme.spacing(2)};
    `,
    apiKeyInfoLabel: css`
      margin-left: ${theme.spacing(1)};
      line-height: 2.2;
      flex-grow: 1;
      color: ${theme.colors.text.secondary};

      span {
        padding: ${theme.spacing(0.5)};
      }
    `,
    filterRow: cx(
      'page-action-bar',
      css`
        display: flex;
        justifycontent: flex-end;
      `
    ),
    filterDelimiter: css`
      flex-grow: 1;
    `,
  };
};

const ServiceAccountsListPage = connector(ServiceAccountsListPageUnconnected);
export default ServiceAccountsListPage;
