/**
 * Development environment — apunta al backend local (sin MockAPI).
 * Ajusta `apiBaseUrl` al puerto de tu API en el otro repositorio.
 */
export const environment = {
  production: false,
  appTitle: 'InfraTrack',
  apiBaseUrl: 'http://localhost:8080/api/v1',
  apiBases: {
    controlPanel: 'http://localhost:8080/api/v1',
    assetManagement: 'http://localhost:8080/api/v1',
    telemetry: 'http://localhost:8080/api/v1',
    operations: 'http://localhost:8080/api/v1',
    subscriptions: 'http://localhost:8080/api/v1',
    identity: 'http://localhost:8080/api/v1',
  },
  iamSignInEndpointPath: '/authentication/sign-in',
  usersEndpointPath: '/users',
  operatorsEndpointPath: '/operators',
  machineryEndpointPath: '/machinery',
  iotNodesEndpointPath: '/iotNodes',
  telemetryDataEndpointPath: '/telemetryData',
  alertsEndpointPath: '/alerts',
  maintenanceRecordsEndpointPath: '/maintenanceRecords',
  subscriptionsEndpointPath: '/subscriptions',
};
