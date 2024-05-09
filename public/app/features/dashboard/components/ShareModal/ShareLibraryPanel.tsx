import React, { useEffect } from 'react';

import { reportInteraction } from '@grafana/runtime/src';
// @todo: replace barrel import path
import { Trans } from 'app/core/internationalization/index';
import { AddLibraryPanelContents } from 'app/features/library-panels/components/AddLibraryPanelModal/AddLibraryPanelModal';

import { ShareModalTabProps } from './types';
import { getTrackingSource } from './utils';

interface Props extends ShareModalTabProps {
  initialFolderUid?: string;
}

export const ShareLibraryPanel = ({ panel, initialFolderUid, onDismiss }: Props) => {
  useEffect(() => {
    reportInteraction('grafana_dashboards_library_panel_share_viewed', { shareResource: getTrackingSource(panel) });
  }, [panel]);

  if (!panel) {
    return null;
  }

  return (
    <>
      <p className="share-modal-info-text">
        <Trans i18nKey="share-modal.library.info">Create library panel.</Trans>
      </p>
      <AddLibraryPanelContents panel={panel} initialFolderUid={initialFolderUid} onDismiss={onDismiss} />
    </>
  );
};
