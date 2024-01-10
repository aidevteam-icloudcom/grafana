import React, { useMemo } from 'react';

import { Alert, CellProps, Column, Icon, InteractiveTable, Text, Tooltip } from '@grafana/ui';
import { AppNotificationSeverity, LdapConnectionInfo, LdapServerInfo } from 'app/types';

interface Props {
  ldapConnectionInfo: LdapConnectionInfo;
}

interface ServerInfo {
  host: string;
  port: number;
  available: boolean;
}

export const LdapConnectionStatus = ({ ldapConnectionInfo }: Props) => {
  const columns = useMemo<Array<Column<ServerInfo>>>(
    () => [
      {
        id: 'host',
        header: 'Host',
      },
      {
        id: 'port',
        header: 'Port',
      },
      {
        id: 'available',
        cell: (serverInfo: CellProps<ServerInfo>) => {
          return serverInfo.available ? (
            <Tooltip content="Connection is available">
              <Icon name="check" className="pull-right" />
            </Tooltip>
          ) : (
            <Tooltip content="Connection is not available">
              <Icon name="exclamation-triangle" className="pull-right" />
            </Tooltip>
          );
        },
      },
    ],
    []
  );

  const data = useMemo<ServerInfo[]>(() => ldapConnectionInfo, [ldapConnectionInfo]);

  return (
    <section>
      <Text color="primary" element="h3">
        LDAP Connection
      </Text>
      <InteractiveTable data={data} columns={columns} getRowId={(serverInfo) => serverInfo.host + serverInfo.port} />
      <LdapErrorBox ldapConnectionInfo={ldapConnectionInfo} />
    </section>
  );
  return (
    <>
      <h3 className="page-heading">LDAP Connection</h3>
      <div className="gf-form-group">
        <div className="gf-form">
          <table className="filter-table form-inline">
            <thead>
              <tr>
                <th>Host</th>
                <th colSpan={2}>Port</th>
              </tr>
            </thead>
            <tbody>
              {ldapConnectionInfo &&
                ldapConnectionInfo.map((serverInfo, index) => (
                  <tr key={index}>
                    <td>{serverInfo.host}</td>
                    <td>{serverInfo.port}</td>
                    <td>
                      {serverInfo.available ? (
                        <Icon name="check" className="pull-right" />
                      ) : (
                        <Icon name="exclamation-triangle" className="pull-right" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="gf-form-group">
          <LdapErrorBox ldapConnectionInfo={ldapConnectionInfo} />
        </div>
      </div>
    </>
  );
};

interface LdapConnectionErrorProps {
  ldapConnectionInfo: LdapConnectionInfo;
}

export const LdapErrorBox = ({ ldapConnectionInfo }: LdapConnectionErrorProps) => {
  const hasError = ldapConnectionInfo.some((info) => info.error);
  if (!hasError) {
    return null;
  }

  const connectionErrors: LdapServerInfo[] = [];
  ldapConnectionInfo.forEach((info) => {
    if (info.error) {
      connectionErrors.push(info);
    }
  });

  const errorElements = connectionErrors.map((info, index) => (
    <div key={index}>
      <span style={{ fontWeight: 500 }}>
        {info.host}:{info.port}
        <br />
      </span>
      <span>{info.error}</span>
      {index !== connectionErrors.length - 1 && (
        <>
          <br />
          <br />
        </>
      )}
    </div>
  ));

  return (
    <Alert title="Connection error" severity={AppNotificationSeverity.Error}>
      {errorElements}
    </Alert>
  );
};
