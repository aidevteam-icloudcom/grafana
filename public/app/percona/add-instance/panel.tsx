/* eslint-disable react/display-name,@typescript-eslint/consistent-type-assertions,@typescript-eslint/no-explicit-any */
import React, { MouseEventHandler, useLayoutEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { HorizontalGroup, Button } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { getPerconaSettings } from 'app/percona/shared/core/selectors';
import { useSelector } from 'app/types';

import { Databases } from '../../percona/shared/core';
import { FeatureLoader } from '../shared/components/Elements/FeatureLoader';
import { PMM_SERVICES_PAGE } from '../shared/components/PerconaBootstrapper/PerconaNavigation';

import { AddInstance } from './components/AddInstance/AddInstance';
import AddRemoteInstance from './components/AddRemoteInstance/AddRemoteInstance';
import { Messages } from './components/AddRemoteInstance/AddRemoteInstance.messages';
import AzureDiscovery from './components/AzureDiscovery/Discovery';
import Discovery from './components/Discovery/Discovery';
import { ADD_INSTANCE_FORM_NAME } from './panel.constants';
import {
  InstanceTypesExtra,
  InstanceAvailable,
  AvailableTypes,
  AddInstanceRouteParams,
  InstanceAvailableType,
  INSTANCE_TYPES_LABELS,
} from './panel.types';

const availableInstanceTypes: AvailableTypes[] = [
  InstanceTypesExtra.rds,
  InstanceTypesExtra.azure,
  Databases.postgresql,
  Databases.mysql,
  Databases.proxysql,
  Databases.mongodb,
  InstanceTypesExtra.external,
  Databases.haproxy,
];

const AddInstancePanel = () => {
  const { result: settings } = useSelector(getPerconaSettings);
  const { azureDiscoverEnabled } = settings!;
  const { instanceType = '' } = useParams<AddInstanceRouteParams>();
  const [selectedInstance, selectInstance] = useState<InstanceAvailable>({
    type: availableInstanceTypes.includes(instanceType as AvailableTypes) ? instanceType : '',
  });
  const [showSelection, setShowSelection] = useState(!instanceType);
  const [submitting, setSubmitting] = useState(false);
  const history = useHistory();
  const { chrome } = useGrafana();

  const handleSubmit = async (submitPromise: Promise<void>) => {
    setSubmitting(true);
    await submitPromise;
    setSubmitting(false);
  };

  const InstanceForm = useMemo(
    () => () => (
      <>
        {selectedInstance.type === InstanceTypesExtra.rds && (
          <Discovery onSubmit={handleSubmit} selectInstance={selectInstance} />
        )}
        {selectedInstance.type === InstanceTypesExtra.azure && (
          <AzureDiscovery onSubmit={handleSubmit} selectInstance={selectInstance} />
        )}
        {selectedInstance.type !== InstanceTypesExtra.rds && selectedInstance.type !== InstanceTypesExtra.azure && (
          <AddRemoteInstance onSubmit={handleSubmit} instance={selectedInstance} selectInstance={selectInstance} />
        )}
      </>
    ),
    [selectedInstance]
  );

  const submitLabel = useMemo(
    () =>
      showSelection
        ? Messages.selectionStep.next
        : selectedInstance.type === InstanceTypesExtra.rds || selectedInstance.type === InstanceTypesExtra.azure
        ? Messages.configurationStep.discover
        : Messages.configurationStep.next,
    [showSelection, selectedInstance]
  );

  const handleCancel: MouseEventHandler = (e) => {
    if (showSelection) {
      history.push('/inventory/services');
    } else {
      history.push('/add-instance');
    }
    selectInstance({ type: '' });
    setShowSelection(true);
  };

  const handleSelectInstance = (instance: InstanceAvailable) => {
    history.push('/add-instance/' + instance.type);
    selectInstance(instance);
    setShowSelection(false);
  };

  const getTitle = (databaseType: InstanceAvailableType) => {
    if (databaseType === InstanceTypesExtra.external) {
      return Messages.form.titles.addExternalService;
    }
    if (databaseType === '') {
      return Messages.form.titles.addRemoteInstance;
    }
    return `Configuring ${INSTANCE_TYPES_LABELS[databaseType]} service`;
  };

  useLayoutEffect(() => {
    chrome.update({
      actions: (
        <HorizontalGroup height="auto" justify="flex-end">
          <Button size="sm" variant="secondary" data-testid="add-edit-role-cancel" type="button" onClick={handleCancel}>
            {showSelection ? Messages.selectionStep.cancel : Messages.configurationStep.cancel}
          </Button>
          {!showSelection && (
            <Button
              disabled={submitting}
              data-testid="add-edit-role-submit"
              form={ADD_INSTANCE_FORM_NAME}
              size="sm"
              type="submit"
              variant="primary"
            >
              {submitLabel}
            </Button>
          )}
        </HorizontalGroup>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelection]);

  return (
    <Page
      navId={PMM_SERVICES_PAGE.id}
      pageNav={
        showSelection
          ? { text: Messages.selection.sectionTitle, subTitle: Messages.selection.description }
          : { text: getTitle(selectedInstance.type) }
      }
    >
      <Page.Contents>
        <FeatureLoader>
          {showSelection ? (
            <AddInstance
              showAzure={!!azureDiscoverEnabled}
              selectedInstanceType={selectedInstance}
              onSelectInstanceType={handleSelectInstance}
            />
          ) : (
            <InstanceForm />
          )}
        </FeatureLoader>
      </Page.Contents>
    </Page>
  );
};

export default AddInstancePanel;
