import React, { FC, useEffect } from 'react';
import { Redirect, Route, RouteChildrenProps, Switch, useLocation, useParams } from 'react-router-dom';

import { NavModelItem } from '@grafana/data';
import { Alert, LoadingPlaceholder, withErrorBoundary } from '@grafana/ui';
import { useDispatch } from 'app/types';

import { AlertmanagerChoice } from '../../../plugins/datasource/alertmanager/types';

import { alertmanagerApi } from './api/alertmanager';
import { AlertManagerPicker } from './components/AlertManagerPicker';
import { AlertingPageWrapper } from './components/AlertingPageWrapper';
import { NoAlertManagerWarning } from './components/NoAlertManagerWarning';
import { EditReceiverView } from './components/receivers/EditReceiverView';
import { EditTemplateView } from './components/receivers/EditTemplateView';
import { GlobalConfigForm } from './components/receivers/GlobalConfigForm';
import { NewReceiverView } from './components/receivers/NewReceiverView';
import { NewTemplateView } from './components/receivers/NewTemplateView';
import { ReceiversAndTemplatesView } from './components/receivers/ReceiversAndTemplatesView';
import { useAlertManagerSourceName } from './hooks/useAlertManagerSourceName';
import { useAlertManagersByPermission } from './hooks/useAlertManagerSources';
import { useUnifiedAlertingSelector } from './hooks/useUnifiedAlertingSelector';
import { fetchAlertManagerConfigAction, fetchGrafanaNotifiersAction } from './state/actions';
import { GRAFANA_RULES_SOURCE_NAME } from './utils/datasource';
import { initialAsyncRequestState } from './utils/redux';

type PageType = 'receivers' | 'templates' | 'global-config';

const Receivers: FC = () => {
  const { useGetAlertmanagerChoiceQuery } = alertmanagerApi;

  const alertManagers = useAlertManagersByPermission('notification');
  const [alertManagerSourceName, setAlertManagerSourceName] = useAlertManagerSourceName(alertManagers);
  const dispatch = useDispatch();

  const { id, type } = useParams<{ id?: string; type?: PageType }>();
  const location = useLocation();
  const isRoot = location.pathname.endsWith('/alerting/notifications');

  const configRequests = useUnifiedAlertingSelector((state) => state.amConfigs);

  const {
    result: config,
    loading,
    error,
  } = (alertManagerSourceName && configRequests[alertManagerSourceName]) || initialAsyncRequestState;
  const receiverTypes = useUnifiedAlertingSelector((state) => state.grafanaNotifiers);

  const shouldLoadConfig = isRoot || !config;

  useEffect(() => {
    if (alertManagerSourceName && shouldLoadConfig) {
      dispatch(fetchAlertManagerConfigAction(alertManagerSourceName));
    }
  }, [alertManagerSourceName, dispatch, shouldLoadConfig]);

  useEffect(() => {
    if (
      alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME &&
      !(receiverTypes.result || receiverTypes.loading || receiverTypes.error)
    ) {
      dispatch(fetchGrafanaNotifiersAction());
    }
  }, [alertManagerSourceName, dispatch, receiverTypes]);

  const { data: alertmanagerChoice } = useGetAlertmanagerChoiceQuery();

  const disableAmSelect = !isRoot;

  let pageNav = getPageNavigationModel(type, id);

  if (!alertManagerSourceName) {
    return isRoot ? (
      <AlertingPageWrapper pageId="receivers" pageNav={pageNav}>
        <NoAlertManagerWarning availableAlertManagers={alertManagers} />
      </AlertingPageWrapper>
    ) : (
      <Redirect to="/alerting/notifications" />
    );
  }

  return (
    <AlertingPageWrapper pageId="receivers" pageNav={pageNav}>
      <AlertManagerPicker
        current={alertManagerSourceName}
        disabled={disableAmSelect}
        onChange={setAlertManagerSourceName}
        dataSources={alertManagers}
      />
      {error && !loading && (
        <Alert severity="error" title="Error loading Alertmanager config">
          {error.message || 'Unknown error.'}
        </Alert>
      )}
      {alertmanagerChoice === AlertmanagerChoice.External && alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME && (
        <Alert title="Grafana Alertmanager is currently disabled">
          Grafana is configured to sent alerts to external Alertmanagers only Changing Grafana Alertmanager
          configuration will not affect your alerts!
        </Alert>
      )}
      {loading && !config && <LoadingPlaceholder text="loading configuration..." />}
      {config && !error && (
        <Switch>
          <Route exact={true} path="/alerting/notifications">
            <ReceiversAndTemplatesView config={config} alertManagerName={alertManagerSourceName} />
          </Route>
          <Route exact={true} path="/alerting/notifications/templates/new">
            <NewTemplateView config={config} alertManagerSourceName={alertManagerSourceName} />
          </Route>
          <Route exact={true} path="/alerting/notifications/templates/:name/edit">
            {({ match }: RouteChildrenProps<{ name: string }>) =>
              match?.params.name && (
                <EditTemplateView
                  alertManagerSourceName={alertManagerSourceName}
                  config={config}
                  templateName={decodeURIComponent(match?.params.name)}
                />
              )
            }
          </Route>
          <Route exact={true} path="/alerting/notifications/receivers/new">
            <NewReceiverView config={config} alertManagerSourceName={alertManagerSourceName} />
          </Route>
          <Route exact={true} path="/alerting/notifications/receivers/:name/edit">
            {({ match }: RouteChildrenProps<{ name: string }>) =>
              match?.params.name && (
                <EditReceiverView
                  alertManagerSourceName={alertManagerSourceName}
                  config={config}
                  receiverName={decodeURIComponent(match?.params.name)}
                />
              )
            }
          </Route>
          <Route exact={true} path="/alerting/notifications/global-config">
            <GlobalConfigForm config={config} alertManagerSourceName={alertManagerSourceName} />
          </Route>
        </Switch>
      )}
    </AlertingPageWrapper>
  );
};

function getPageNavigationModel(type: PageType | undefined, id: string | undefined) {
  let pageNav: NavModelItem | undefined;
  if (type === 'receivers' || type === 'templates') {
    const objectText = type === 'receivers' ? 'contact point' : 'message template';
    if (id) {
      pageNav = {
        text: id,
        subTitle: `Edit the settings for a specific ${objectText}`,
      };
    } else {
      pageNav = {
        text: `New ${objectText}`,
        subTitle: `Create a new ${objectText} for your notifications`,
      };
    }
  } else if (type === 'global-config') {
    pageNav = {
      text: 'Global config',
      subTitle: 'Manage your global configuration',
    };
  }
  return pageNav;
}

export default withErrorBoundary(Receivers, { style: 'page' });
