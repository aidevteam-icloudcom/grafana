import React, { FC, useContext } from 'react';

import { IconButton, useStyles } from '@grafana/ui';

import { NotificationChannelProvider } from '../NotificationChannel.provider';

import { getStyles } from './NotificationChannelActions.styles';
import { NotificationChannelActionsProps } from './NotificationChannelActions.types';

export const NotificationChannelActions: FC<NotificationChannelActionsProps> = ({ notificationChannel }) => {
  const styles = useStyles(getStyles);
  const { setSelectedNotificationChannel, setAddModalVisible, setDeleteModalVisible } =
    useContext(NotificationChannelProvider);

  return (
    <div className={styles.actionsWrapper}>
      <IconButton
        data-testid="edit-notification-channel-button"
        name="pen"
        onClick={() => {
          setSelectedNotificationChannel(notificationChannel);
          setAddModalVisible(true);
        }}
      />
      <IconButton
        data-testid="delete-notification-channel-button"
        name="times"
        onClick={() => {
          setSelectedNotificationChannel(notificationChannel);
          setDeleteModalVisible(true);
        }}
      />
    </div>
  );
};
NotificationChannelActions.displayName = 'NotificationChannelActions';
