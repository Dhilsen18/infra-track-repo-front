import { INJECTED_API_BASE_URLS } from '../app/shared/infrastructure/api-bases.inject';

/**
 * Production environment configuration.
 *
 * @remarks
 * API base URLs are injected at build time via `scripts/inject-api-bases.mjs`.
 */
export const environment = {
  production: true,
  appTitle: 'InfraTrack',
  apiBases: INJECTED_API_BASE_URLS,
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
