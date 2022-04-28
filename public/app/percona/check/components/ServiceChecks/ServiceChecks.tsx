/* eslint-disable react/display-name */
import React, { FC, useEffect, useCallback, useState, useMemo } from 'react';
import { useStyles2 } from '@grafana/ui';
import { logger, Chip } from '@percona/platform-core';
import { Cell, Column, Row } from 'react-table';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { Table } from 'app/percona/integrated-alerting/components/Table';
import { useCancelToken } from 'app/percona/shared/components/hooks/cancelToken.hook';
import { useStoredTablePageSize } from 'app/percona/integrated-alerting/components/Table/Pagination';
import { CheckService } from 'app/percona/check/Check.service';
import { isApiCancelError } from 'app/percona/shared/helpers/api';
import { ServiceFailedCheck } from '../../types';
import { SERVICE_CHECKS_CANCEL_TOKEN, SERVICE_CHECKS_TABLE_ID } from './ServiceChecks.constants';
import { Messages } from './ServiceChecks.messages';
import { getStyles } from './ServiceChecks.styles';
import { Severity } from 'app/percona/integrated-alerting/components/Severity';
import { formatServiceId } from '../FailedChecksTab/FailedChecksTab.utils';
import { SilenceBell } from 'app/percona/shared/components/Elements/SilenceBell';
import { ExpandableCell } from 'app/percona/shared/components/Elements/ExpandableCell';
import Page from 'app/core/components/Page/Page';
import { usePerconaNavModel } from 'app/percona/shared/components/hooks/perconaNavModel';

export const ServiceChecks: FC<GrafanaRouteComponentProps<{ service: string }>> = ({ match }) => {
  const serviceId = formatServiceId(match.params.service);
  const [pageSize, setPageSize] = useStoredTablePageSize(SERVICE_CHECKS_TABLE_ID);
  const [pageIndex, setPageindex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [data, setData] = useState<ServiceFailedCheck[]>([]);
  const [pending, setPending] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [generateToken] = useCancelToken();
  const styles = useStyles2(getStyles);
  const navModel = usePerconaNavModel('failed-checks');

  const fetchChecks = useCallback(async () => {
    try {
      setPending(true);
      const {
        data,
        totals: { totalItems, totalPages },
      } = await CheckService.getFailedCheckForService(
        serviceId,
        pageSize,
        pageIndex,
        generateToken(SERVICE_CHECKS_CANCEL_TOKEN)
      );
      setData(data);
      setServiceName(data[0].serviceName);
      setTotalItems(totalItems);
      setTotalPages(totalPages);
    } catch (e) {
      if (isApiCancelError(e)) {
        return;
      }
      logger.error(e);
    }
    setPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, serviceId]);

  const onSilenceClick = useCallback(
    async (alertId: string, silenced: boolean) => {
      await CheckService.silenceAlert(alertId, !silenced);
      fetchChecks();
    },
    [fetchChecks]
  );

  const columns = useMemo(
    (): Array<Column<ServiceFailedCheck>> => [
      {
        Header: 'Check Name',
        accessor: 'checkName',
        Cell: ({ row, value }) => <ExpandableCell row={row} value={value} />,
      },
      {
        Header: 'Summary',
        accessor: 'summary',
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Severity',
        accessor: 'severity',
        Cell: ({ value }) => <Severity severity={value} />,
      },
      {
        Header: 'Details',
        accessor: 'readMoreUrl',
        width: '105px',
        Cell: ({ value }) =>
          value ? (
            <a data-testid="read-more-link" target="_blank" rel="noreferrer" href={value} className={styles.link}>
              {Messages.readMore}
            </a>
          ) : null,
      },
      {
        Header: 'Actions',
        accessor: 'silenced',
        width: '30px',
        Cell: ({ value, row }) => (
          <span className={styles.actions}>
            <SilenceBell
              tooltip={value ? Messages.activate : Messages.silence}
              silenced={value}
              onClick={() => onSilenceClick(row.original.alertId, row.original.silenced)}
            />
          </span>
        ),
      },
    ],
    [styles.link, styles.actions, onSilenceClick]
  );

  const onPaginationChanged = useCallback(
    (pageSize: number, pageIndex: number) => {
      setPageSize(pageSize);
      setPageindex(pageIndex);
    },
    [setPageindex, setPageSize]
  );

  const getCellProps = useCallback(
    (cell: Cell<ServiceFailedCheck>) => ({
      className: !!cell.row.original.silenced ? styles.disabledRow : '',
      key: cell.row.original.alertId,
    }),
    [styles.disabledRow]
  );

  const renderSelectedSubRow = React.useCallback(
    (row: Row<ServiceFailedCheck>) => (
      <div className={styles.secondaryLabels}>
        {[...row.original.labels.primary, ...row.original.labels.secondary].map((label) => (
          <Chip key={label} text={label} />
        ))}
      </div>
    ),
    [styles.secondaryLabels]
  );

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  return (
    <Page navModel={navModel}>
      <Page.Contents dataTestId="db-service-checks">
        <h3 data-testid="page-service">{Messages.pageTitle(serviceName)}</h3>
        <Table
          showPagination
          data={data}
          columns={columns}
          totalItems={totalItems}
          totalPages={totalPages}
          pageSize={pageSize}
          pageIndex={pageIndex}
          onPaginationChanged={onPaginationChanged}
          renderExpandedRow={renderSelectedSubRow}
          getCellProps={getCellProps}
          pendingRequest={pending}
          emptyMessage={Messages.noChecks}
        />
      </Page.Contents>
    </Page>
  );
};

export default ServiceChecks;
