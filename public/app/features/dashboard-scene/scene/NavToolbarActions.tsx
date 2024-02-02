import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Box, Button, Icon, ToolbarButton, ToolbarButtonRow, useStyles2 } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { NavToolbarSeparator } from 'app/core/components/AppChrome/NavToolbar/NavToolbarSeparator';
import { t } from 'app/core/internationalization';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

import { ShareModal } from '../sharing/ShareModal';
import { DashboardInteractions } from '../utils/interactions';
import { dynamicDashNavActions } from '../utils/registerDynamicDashNavAction';

import { DashboardScene } from './DashboardScene';

interface Props {
  dashboard: DashboardScene;
}

export const NavToolbarActions = React.memo<Props>(({ dashboard }) => {
  const { isEditing, viewPanelScene, isDirty, uid, meta, editview } = dashboard.useState();
  const buttonWithExtraMargin = useStyles2(getStyles);
  const toolbarActions: ToolbarAction[] = [];

  toolbarActions.push({
    group: 'icon-actions',
    condition: uid && !editview && Boolean(meta.canStar),
    render: () => {
      let desc = meta.isStarred
        ? t('dashboard.toolbar.unmark-favorite', 'Unmark as favorite')
        : t('dashboard.toolbar.mark-favorite', 'Mark as favorite');
      return (
        <ToolbarButton
          tooltip={desc}
          icon={
            <Icon name={meta.isStarred ? 'favorite' : 'star'} size="lg" type={meta.isStarred ? 'mono' : 'default'} />
          }
          onClick={() => {
            DashboardInteractions.toolbarFavoritesClick();
            dashboard.onStarDashboard();
          }}
        />
      );
    },
  });

  toolbarActions.push({
    group: 'icon-actions',
    condition: uid && !editview,
    render: () => (
      <ToolbarButton
        key="view-in-old-dashboard-button"
        tooltip={'Switch to old dashboard page'}
        icon="apps"
        onClick={() => locationService.push(`/d/${uid}`)}
      />
    ),
  });

  if (dynamicDashNavActions.left.length > 0) {
    dynamicDashNavActions.left.map((action, index) => {
      const props = { dashboard: getDashboardSrv().getCurrent()! };
      if (action.show(props)) {
        const Component = action.component;
        toolbarActions.push({
          group: 'icon-actions',
          condition: true,
          render: () => <Component {...props} />,
        });
      }
    });
  }

  toolbarActions.push({
    group: 'back-button',
    condition: Boolean(viewPanelScene),
    render: () => (
      <Button
        onClick={() => {
          locationService.partial({ viewPanel: null });
        }}
        tooltip=""
        key="back"
        variant="secondary"
        size="sm"
        icon="arrow-left"
      >
        Back to dashboard
      </Button>
    ),
  });

  toolbarActions.push({
    group: 'back-button',
    condition: Boolean(editview),
    render: () => (
      <Button
        onClick={() => {
          locationService.partial({ editview: null });
        }}
        tooltip=""
        key="back"
        fill="text"
        variant="secondary"
        size="sm"
        icon="arrow-left"
      >
        Back to dashboard
      </Button>
    ),
  });

  toolbarActions.push({
    group: 'main-buttons',
    condition: !isEditing && dashboard.canEditDashboard() && !viewPanelScene,
    render: () => (
      <Button
        onClick={() => {
          dashboard.onEnterEditMode();
        }}
        tooltip="Enter edit mode"
        key="edit"
        className={buttonWithExtraMargin}
        variant="primary"
        size="sm"
      >
        Edit
      </Button>
    ),
  });

  toolbarActions.push({
    group: 'settings',
    condition: isEditing && dashboard.canEditDashboard() && !viewPanelScene && !editview,
    render: () => (
      <Button
        onClick={() => {
          dashboard.onOpenSettings();
        }}
        tooltip="Dashboard settings"
        fill="text"
        size="sm"
        key="settings"
        variant="secondary"
      >
        Settings
      </Button>
    ),
  });

  toolbarActions.push({
    group: 'main-buttons',
    condition: isEditing && !editview && !meta.isNew,
    render: () => (
      <Button
        onClick={dashboard.onDiscard}
        tooltip="Exits edit mode and discards unsaved changes"
        size="sm"
        key="discard"
        fill="text"
        variant="primary"
      >
        Done editing
      </Button>
    ),
  });

  if (!dashboard.state.meta.isNew) {
    // toolbarActions.push(
    //   <Button
    //     onClick={() => {
    //       dashboard.openSaveDrawer({ saveAsCopy: true });
    //     }}
    //     size="sm"
    //     tooltip="Save as copy"
    //     fill="text"
    //     key="save-as"
    //   >
    //     Save as
    //   </Button>
    // );
  }

  toolbarActions.push({
    group: 'main-buttons',
    condition: isEditing && meta.canSave,
    render: () => (
      <Button
        onClick={() => {
          DashboardInteractions.toolbarSaveClick();
          dashboard.openSaveDrawer({});
        }}
        tooltip="Save changes"
        key="save"
        className={buttonWithExtraMargin}
        size="sm"
        variant={isDirty ? 'primary' : 'secondary'}
      >
        Save dashboard
      </Button>
    ),
  });

  toolbarActions.push({
    group: 'main-buttons',
    condition: uid,
    render: () => (
      <Button
        key="share-dashboard-button"
        tooltip={t('dashboard.toolbar.share', 'Share dashboard')}
        size="sm"
        className={buttonWithExtraMargin}
        fill="outline"
        onClick={() => {
          DashboardInteractions.toolbarShareClick();
          dashboard.showModal(new ShareModal({ dashboardRef: dashboard.getRef() }));
        }}
      >
        Share
      </Button>
    ),
  });

  const actionElements: React.ReactNode[] = [];
  let lastGroup = '';

  for (const action of toolbarActions) {
    if (!action.condition) {
      continue;
    }

    if (lastGroup && lastGroup !== action.group) {
      lastGroup && actionElements.push(<NavToolbarSeparator key={`${lastGroup}-separator`} />);
    }

    actionElements.push(action.render());
    lastGroup = action.group;
  }

  return <AppChromeUpdate actions={<ToolbarButtonRow alignment="right">{actionElements}</ToolbarButtonRow>} />;
});

export interface ToolbarAction {
  group: string;
  condition?: boolean | string;
  render: () => React.ReactNode;
}

NavToolbarActions.displayName = 'NavToolbarActions';

export function ButtonWithExtraSpacing({ children }: { children: React.ReactNode }) {
  return (
    <Box paddingLeft={0.5} paddingRight={0.5}>
      {children}
    </Box>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return css({ margin: theme.spacing(0, 0.5) });
}
