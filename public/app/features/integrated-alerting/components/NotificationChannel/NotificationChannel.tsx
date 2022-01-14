/* eslint-disable react/display-name */
import { logger } from '@percona/platform-core';
import React, { FC, useMemo, useState, useEffect, useCallback } from 'react';

import { Button, useStyles } from '@grafana/ui';

import { useStoredTablePageSize } from '../Table/Pagination';
import { Table } from '../Table/Table';

import { AddNotificationChannelModal } from './AddNotificationChannelModal';
import { DeleteNotificationChannelModal } from './DeleteNotificationChannelModal/DeleteNotificationChannelModal';
import { NOTIFICATION_CHANNEL_TABLE_ID } from './NotificationChannel.constants';
import { Messages } from './NotificationChannel.messages';
import { NotificationChannelProvider } from './NotificationChannel.provider';
import { NotificationChannelService } from './NotificationChannel.service';
import { getStyles } from './NotificationChannel.styles';
import { NotificationChannel as Channel } from './NotificationChannel.types';
import { NotificationChannelActions } from './NotificationChannelActions/NotificationChannelActions';

const { emptyTable, nameColumn, typeColumn, actionsColumn, typeLabel } = Messages;

export const NotificationChannel: FC = () => {
  const styles = useStyles(getStyles);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(true);
  const [data, setData] = useState<Channel[]>([]);
  const [pageSize, setPageSize] = useStoredTablePageSize(NOTIFICATION_CHANNEL_TABLE_ID);
  const [pageIndex, setPageindex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedNotificationChannel, setSelectedNotificationChannel] = useState<Channel | null>();

  const columns = useMemo(
    () => [
      {
        Header: nameColumn,
        accessor: 'summary',
      },
      {
        Header: typeColumn,
        accessor: ({ type }: Channel) => typeLabel[type],
      },
      {
        Header: actionsColumn,
        width: '80px',
        accessor: (notificationChannel: Channel) => (
          <NotificationChannelActions notificationChannel={notificationChannel} />
        ),
      },
    ],
    []
  );

  // TODO set totalPages, totalItems as pass them to the table
  const getNotificationChannels = useCallback(async () => {
    setPendingRequest(true);
    try {
      const { channels, totals } = await NotificationChannelService.list({
        page_params: {
          index: pageIndex,
          page_size: pageSize as number,
        },
      });
      setData(channels);
      setTotalItems(totals.total_items || 0);
      setTotalPages(totals.total_pages || 0);
    } catch (e) {
      logger.error(e);
    } finally {
      setPendingRequest(false);
    }
  }, [pageIndex, pageSize]);

  const handlePaginationChanged = useCallback(
    (pageSize: number, pageIndex: number) => {
      setPageSize(pageSize);
      setPageindex(pageIndex);
    },
    [setPageSize, setPageindex]
  );

  useEffect(() => {
    getNotificationChannels();
  }, [pageSize, pageIndex, getNotificationChannels]);

  return (
    <NotificationChannelProvider.Provider
      value={{ getNotificationChannels, setSelectedNotificationChannel, setAddModalVisible, setDeleteModalVisible }}
    >
      <div className={styles.actionsWrapper}>
        <Button
          size="md"
          icon="plus-square"
          variant="link"
          onClick={() => {
            setSelectedNotificationChannel(null);
            setAddModalVisible(!addModalVisible);
          }}
          data-qa="notification-channel-add-modal-button"
        >
          {Messages.addAction}
        </Button>
      </div>
      <Table
        showPagination
        totalItems={totalItems}
        totalPages={totalPages}
        pageSize={pageSize}
        pageIndex={pageIndex}
        onPaginationChanged={handlePaginationChanged}
        data={data}
        columns={columns}
        pendingRequest={pendingRequest}
        emptyMessage={emptyTable}
      />
      <AddNotificationChannelModal
        isVisible={addModalVisible}
        setVisible={setAddModalVisible}
        notificationChannel={selectedNotificationChannel}
      />
      <DeleteNotificationChannelModal
        isVisible={deleteModalVisible}
        setVisible={setDeleteModalVisible}
        notificationChannel={selectedNotificationChannel}
      />
    </NotificationChannelProvider.Provider>
  );
};

NotificationChannel.displayName = 'NotificationChannel';
