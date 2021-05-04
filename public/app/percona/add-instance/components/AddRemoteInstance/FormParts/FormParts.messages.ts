export const Messages = {
  form: {
    trackingOptions: {
      none: "Don't track",
      pgStatements: 'PG Stat Statements',
      pgMonitor: 'PG Stat Monitor',
    },
    labels: {
      trackingOptions: 'Stat tracking options',
      externalService: {
        url: 'URL string',
        schema: 'Schema',
        metricsPath: 'Metrics path',
        group: 'Group',
        address: 'External service hostname',
        serviceName: 'Service name',
        port: 'External service port',
        username: 'Username',
        password: 'Password',
      },
      mainDetails: {
        address: 'Hostname',
        serviceName: 'Service name',
        port: 'Port',
        username: 'Username',
        password: 'Password',
      },
      labels: {
        environment: 'Environment',
        region: 'Region',
        az: 'Availability Zone',
        replicationSet: 'Replication set',
        cluster: 'Cluster',
        customLabels: 'Custom labels',
      },
      additionalOptions: {
        skipConnectionCheck: 'Skip connection check',
        tls: 'Use TLS for database connections',
        tlsCertificateFilePassword: 'TLS certificate password',
        tlsCertificateKey: 'TLS certificate key',
        tlsCertificate: 'TLS certificate',
        tlsCA: 'TLS CA',
        tlsSkipVerify: 'Skip TLS certificate and hostname validation',
        qanMysqlPerfschema: 'Use performance schema',
        qanMongodbProfiler: 'Use QAN MongoDB Profiler',
        disableBasicMetrics: 'Disable Basic Metrics',
        disableEnchancedMetrics: 'Disable Enhanced Metrics',
        tablestatOptions: 'Table statistics limit',
        azureDatabaseExporter: 'Enable Monitoring by Azure Metrics Exporter',
      },
    },
    placeholders: {
      externalService: {
        url: 'http://example.com:3333/path/to/metrics',
        metricsPath: '/path/to/metrics',
        address: 'Hostname',
        serviceName: 'Service name (default: Hostname)',
        username: 'Username',
        password: 'Password',
      },
      mainDetails: {
        address: 'Hostname',
        serviceName: 'Service name (default: Hostname)',
        username: 'Username',
        password: 'Password',
      },
      labels: {
        environment: 'Environment',
        region: 'Region',
        az: 'Availability Zone',
        replicationSet: 'Replication set',
        cluster: 'Cluster',
        customLabels: '"Custom labels\n Format:\n      key1:value1\n      key2:value2"',
      },
      additionalOptions: {},
    },
    tooltips: {
      externalService: {
        url: 'Your external service endpoint',
        schema: 'Used version of protocol',
        metricsPath: 'Path to your metrics',
        group: 'Group to which your service belongs',
        address: 'Public DNS hostname of your instance',
        serviceName: 'Service name to use',
        port: 'Port your external service is listening on',
        username: 'Your external service username',
        password: 'Your external service password',
      },
      mainDetails: {
        address: 'Public DNS hostname of your instance',
        serviceName: 'Service name to use',
        port: 'Port your service is listening on',
        username: 'Your database user name',
        password: 'Your database password',
      },
      haproxy: {
        port: 'HAProxy prometheus exporter port',
        username: 'username for HAProxy prometheus exporter',
        password: 'password for HAProxy prometheus exporter',
      },
      labels: {
        region: 'Region',
        az: 'Availability Zone',
      },
    },
    titles: {
      mainDetails: 'Main details',
      labels: 'Labels',
      additionalOptions: 'Additional options',
      parseURL: 'Parse URL',
      connectionDetails: 'External service connection details',
    },
  },
};
