import React, { FC, useEffect, useState } from 'react';
import { useCancelToken } from 'app/percona/shared/components/hooks/cancelToken.hook';
import { isApiCancelError } from 'app/percona/shared/helpers/api';
import DiscoveryService from './Discovery.service';
import Credentials from './components/Credentials/Credentials';
import Instances from './components/Instances/Instances';
import { getStyles } from './Discovery.styles';
import { DiscoverySearchPanelProps, Instance } from './Discovery.types';
import { AzureCredentialsForm } from './components/Credentials/Credentials.types';
import { logger } from '@percona/platform-core';
import { DISCOVERY_AZURE_CANCEL_TOKEN } from './Discovery.constants';

const Discovery: FC<DiscoverySearchPanelProps> = ({ selectInstance }) => {
  const styles = getStyles();

  const [instances, setInstances] = useState<Instance[]>([]);
  const [credentials, setCredentials] = useState<AzureCredentialsForm>({});
  const [loading, startLoading] = useState(false);
  const [generateToken] = useCancelToken();

  useEffect(() => {
    const updateInstances = async () => {
      try {
        const result = await DiscoveryService.discoveryAzure(credentials, generateToken(DISCOVERY_AZURE_CANCEL_TOKEN));
        if (result) {
          setInstances(result.azure_database_instance);
        }
      } catch (e) {
        if (isApiCancelError(e)) {
          return;
        }
        logger.error(e);
      }
      startLoading(false);
    };

    if (
      credentials.azure_client_id &&
      credentials.azure_client_secret &&
      credentials.azure_tenant_id &&
      credentials.azure_subscription_id
    ) {
      startLoading(true);
      updateInstances();
    }
  }, [credentials, generateToken]);

  return (
    <>
      <div className={styles.content}>
        <Credentials onSetCredentials={setCredentials} selectInstance={selectInstance} />
        <Instances instances={instances} selectInstance={selectInstance} credentials={credentials} loading={loading} />
      </div>
    </>
  );
};

export default Discovery;
