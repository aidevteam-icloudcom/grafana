/* eslint-disable react/display-name */
import { logger } from '@percona/platform-core';
import React, { FC, useMemo, useState, useEffect, useCallback } from 'react';
import { Column, Row } from 'react-table';

import { Button, useStyles } from '@grafana/ui';
import { Table } from 'app/percona/integrated-alerting/components/Table';
import { ExpandableCell } from 'app/percona/shared/components/Elements/ExpandableCell/ExpandableCell';
import { useCancelToken } from 'app/percona/shared/components/hooks/cancelToken.hook';
import { DATABASE_LABELS } from 'app/percona/shared/core';
import { isApiCancelError } from 'app/percona/shared/helpers/api';

import { useRecurringCall } from '../../hooks/recurringCall.hook';

import { AddBackupModal } from './AddBackupModal';
import { AddBackupFormProps } from './AddBackupModal/AddBackupModal.types';
import { BackupCreation } from './BackupCreation';
import {
  BACKUP_CANCEL_TOKEN,
  LIST_ARTIFACTS_CANCEL_TOKEN,
  RESTORE_CANCEL_TOKEN,
  DATA_INTERVAL,
} from './BackupInventory.constants';
import { Messages } from './BackupInventory.messages';
import { BackupInventoryService } from './BackupInventory.service';
import { getStyles } from './BackupInventory.styles';
import { Backup, Status } from './BackupInventory.types';
import { BackupInventoryActions } from './BackupInventoryActions';
import { BackupInventoryDetails } from './BackupInventoryDetails';
import { RestoreBackupModal } from './RestoreBackupModal';

const { columns, noData } = Messages;
const { name, created, location, vendor, status, actions } = columns;

export const BackupInventory: FC = () => {
  const [pending, setPending] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [data, setData] = useState<Backup[]>([]);
  const [triggerTimeout] = useRecurringCall();
  const [generateToken] = useCancelToken();
  const columns = useMemo(
    (): Column[] => [
      {
        Header: name,
        accessor: 'name',
        id: 'name',
        width: '250px',
        Cell: ({ row, value }) => <ExpandableCell row={row} value={value} />,
      },
      {
        Header: vendor,
        accessor: ({ vendor }: Backup) => DATABASE_LABELS[vendor],
        width: '150px',
      },
      {
        Header: created,
        accessor: 'created',
        Cell: ({ value }) => <BackupCreation date={value} />,
      },
      {
        Header: location,
        accessor: 'locationName',
      },
      {
        Header: status,
        accessor: 'status',
        Cell: ({ value }) => <Status status={value} />,
      },
      {
        Header: actions,
        accessor: 'id',
        Cell: ({ row }) => (
          <BackupInventoryActions onRestore={onRestoreClick} onBackup={onBackupClick} backup={row.original as Backup} />
        ),
        width: '110px',
      },
    ],
    []
  );
  const styles = useStyles(getStyles);

  const onRestoreClick = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreModalVisible(true);
  };

  const handleClose = () => {
    setSelectedBackup(null);
    setRestoreModalVisible(false);
    setBackupModalVisible(false);
  };

  const handleRestore = async (serviceId: string, locationId: string, artifactId: string) => {
    try {
      await BackupInventoryService.restore(serviceId, locationId, artifactId, generateToken(RESTORE_CANCEL_TOKEN));
      setRestoreModalVisible(false);
    } catch (e) {
      logger.error(e);
    }
  };

  const getData = useCallback(
    async (showLoading = false) => {
      showLoading && setPending(true);

      try {
        const backups = await BackupInventoryService.list(generateToken(LIST_ARTIFACTS_CANCEL_TOKEN));
        setData(backups);
      } catch (e) {
        if (isApiCancelError(e)) {
          return;
        }
        logger.error(e);
      }
      setPending(false);
    },
    [generateToken]
  );

  const renderSelectedSubRow = React.useCallback(
    (row: Row<Backup>) => (
      <BackupInventoryDetails
        name={row.original.name}
        status={row.original.status}
        dataModel={row.original.dataModel}
      />
    ),
    []
  );

  const onBackupClick = (backup: Backup | null) => {
    setSelectedBackup(backup);
    setBackupModalVisible(true);
  };

  const handleBackup = async ({ service, location, backupName, description }: AddBackupFormProps) => {
    try {
      await BackupInventoryService.backup(
        service.value?.id || '',
        location.value || '',
        backupName,
        description,
        generateToken(BACKUP_CANCEL_TOKEN)
      );
      setBackupModalVisible(false);
      setSelectedBackup(null);
      getData(true);
    } catch (e) {
      if (isApiCancelError(e)) {
        return;
      }
      logger.error(e);
    }
  };

  useEffect(() => {
    getData(true).then(() => triggerTimeout(getData, DATA_INTERVAL));
  }, [getData, triggerTimeout]);

  return (
    <>
      <div className={styles.addWrapper}>
        <Button
          size="md"
          icon="plus-square"
          variant="link"
          data-qa="backup-add-modal-button"
          onClick={() => onBackupClick(null)}
        >
          {Messages.add}
        </Button>
      </div>
      <Table
        data={data}
        totalItems={data.length}
        columns={columns}
        emptyMessage={noData}
        pendingRequest={pending}
        autoResetExpanded={false}
        renderExpandedRow={renderSelectedSubRow}
      ></Table>
      <RestoreBackupModal
        backup={selectedBackup}
        isVisible={restoreModalVisible}
        onClose={handleClose}
        onRestore={handleRestore}
      />
      <AddBackupModal
        backup={selectedBackup}
        isVisible={backupModalVisible}
        onClose={handleClose}
        onBackup={handleBackup}
      />
    </>
  );
};
