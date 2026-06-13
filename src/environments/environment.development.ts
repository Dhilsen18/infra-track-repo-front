/**
 * Development environment — apunta al backend desplegado en Render.
 */
const API_BASE = 'https://infratrack-api.onrender.com/api/v1';

export const environment = {
  production: false,
  appTitle: 'InfraTrack',
  apiBaseUrl: API_BASE,
  apiBases: {
    controlPanel: API_BASE,
    assetManagement: API_BASE,
    telemetry: API_BASE,
    operations: API_BASE,
    subscriptions: API_BASE,
    identity: API_BASE,
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
