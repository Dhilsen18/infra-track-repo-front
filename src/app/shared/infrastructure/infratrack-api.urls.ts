import { environment } from '../../../environments/environment';

/**
 * REST routes by entity (MockAPI / platform provider).
 */
export const INFRATRACK_API = {
  users: `${environment.apiBases.identity}${environment.usersEndpointPath}`,
  operators: `${environment.apiBases.identity}${environment.operatorsEndpointPath}`,
  machinery: `${environment.apiBases.assetManagement}${environment.machineryEndpointPath}`,
  /** In MockAPI the `iotNodes` resource lives in the telemetry project. */
  iotNodes: `${environment.apiBases.telemetry}${environment.iotNodesEndpointPath}`,
  telemetryData: `${environment.apiBases.telemetry}${environment.telemetryDataEndpointPath}`,
  alerts: `${environment.apiBases.controlPanel}${environment.alertsEndpointPath}`,
  maintenanceRecords: `${environment.apiBases.assetManagement}${environment.maintenanceRecordsEndpointPath}`,
  subscriptions: `${environment.apiBases.subscriptions}${environment.subscriptionsEndpointPath}`,
} as const;

/** @deprecated Prefer infrastructure resource contracts naming in new code. */
export { INFRATRACK_API as INFRATRACK_API_URLS };
