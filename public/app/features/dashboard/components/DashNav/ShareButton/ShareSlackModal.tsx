import { css } from '@emotion/css';
import { capitalize } from 'lodash';
import React, { useEffect, useState } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Field, Modal, MultiSelect, Spinner, TextArea, useStyles2 } from '@grafana/ui';

import { useCreatePreviewQuery, useGetChannelsQuery, useShareMutation } from '../../../api/shareToSlackApi';

export function ShareSlackModal({
  resourceUid,
  resourceUrl,
  onDismiss,
  resourceType,
}: {
  resourceUid: string;
  resourceUrl: string;
  onDismiss(): void;
  resourceType: 'dashboard' | 'panel';
}) {
  const [value, setValue] = useState<Array<SelectableValue<string>>>([]);
  const [description, setDescription] = useState<string>();

  const styles = useStyles2(getStyles);

  const { data: channels, isLoading: isChannelsLoading, isFetching: isChannelsFetching } = useGetChannelsQuery();
  const {
    data: preview,
    isLoading: isPreviewLoading,
    refetch,
    isFetching: isPreviewFetching,
    isError,
  } = useCreatePreviewQuery({ resourceUid, resourceUrl }, { refetchOnMountOrArgChange: false });
  const [share, { isLoading: isShareLoading, isSuccess: isShareSuccess }] = useShareMutation();

  const disableShareButton = isChannelsLoading || isChannelsFetching || isPreviewLoading || isPreviewFetching;

  useEffect(() => {
    if (isShareSuccess) {
      onDismiss();
    }
  }, [isShareSuccess, onDismiss]);

  const onShareClick = () => {
    share({
      channelIds: value.map((v) => v.value!),
      message: description,
      imagePreviewUrl: preview!.previewUrl,
      dashboardUid: resourceUid,
      dashboardPath: resourceUrl,
    });
  };

  return (
    <Modal className={styles.modal} isOpen title="Share to Slack" onDismiss={onDismiss}>
      <div>
        <Field label="Select channel *">
          <MultiSelect
            isLoading={isChannelsLoading || isChannelsFetching}
            placeholder="Select channel"
            options={channels}
            value={value}
            onChange={setValue}
          />
        </Field>
        <Field label="Description">
          <TextArea
            placeholder="Type your message"
            cols={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
        </Field>
        <Field label={`${capitalize(resourceType)} preview`} horizontal className={styles.refreshContainer}>
          {preview ? (
            <Button size="sm" icon="sync" variant="primary" fill="text" onClick={refetch}>
              Refresh
            </Button>
          ) : (
            <></>
          )}
        </Field>
        {isPreviewLoading || isPreviewFetching ? (
          <div className={styles.loadingContainer}>
            <img
              className={styles.loadingPreview}
              alt="preview-placeholder"
              src={`public/img/share/loading_${resourceType}_preview.gif`}
            />
            <p className={styles.description}>We are generating your {resourceType} preview</p>
          </div>
        ) : (
          <img className={styles.dashboardPreview} alt="dashboard-preview" src={preview?.previewUrl} />
        )}
      </div>
      <Modal.ButtonRow>
        {isShareLoading && <Spinner size="lg" />}
        <Button variant="secondary" fill="outline" onClick={onDismiss}>
          Cancel
        </Button>
        <Button disabled={!value.length || disableShareButton || isShareLoading || isError} onClick={onShareClick}>
          Share
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css({
    width: '500px',
  }),
  refreshContainer: css({
    alignItems: 'center',
  }),
  loadingContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  loadingPreview: css({
    width: '66%',
  }),
  dashboardPreview: css({
    width: '100%',
  }),
  description: css({
    ...theme.typography.body,
  }),
});
