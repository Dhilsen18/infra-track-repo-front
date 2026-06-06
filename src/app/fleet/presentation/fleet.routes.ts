import { Routes } from '@angular/router';

import { adminGuard, ownerOnlyGuard } from '../../iam/infrastructure/iam.guard';
import {
  planCanAddIotDeviceGuard,
  planCanAddTransportGuard,
  planDriversGuard,
} from '../../shared/infrastructure/subscription/plan.guard';

const iotDeviceList = () =>
  import('./views/iot-device-list/iot-device-list').then((m) => m.IotDeviceList);
const iotDeviceWizard = () =>
  import('./views/iot-device-wizard/iot-device-wizard').then((m) => m.IotDeviceWizard);
const iotDeviceDetail = () =>
  import('./views/iot-device-detail/iot-device-detail').then((m) => m.IotDeviceDetail);
const transportList = () =>
  import('./views/transport-list/transport-list').then((m) => m.TransportList);
const transportWizard = () =>
  import('./views/transport-wizard/transport-wizard').then((m) => m.TransportWizard);
const transportDetail = () =>
  import('./views/transport-detail/transport-detail').then((m) => m.TransportDetail);
const driverList = () => import('./views/driver-list/driver-list').then((m) => m.DriverList);
const driverDetail = () =>
  import('./views/driver-detail/driver-detail').then((m) => m.DriverDetail);
const configurationView = () =>
  import('./views/configuration-view/configuration-view').then((m) => m.ConfigurationView);

/** Admin — /dispositivos */
export const fleetIotRoutes: Routes = [
  { path: '', canActivate: [adminGuard], loadComponent: iotDeviceList, title: 'InfraTrack - IoT Devices' },
  { path: 'nuevo', canActivate: [adminGuard, planCanAddIotDeviceGuard], loadComponent: iotDeviceWizard, title: 'InfraTrack - New IoT Device' },
  { path: ':deviceId', canActivate: [adminGuard], loadComponent: iotDeviceDetail, title: 'InfraTrack - IoT Device Detail' },
];

/** Admin — /transportes */
export const fleetTransportRoutes: Routes = [
  { path: '', canActivate: [adminGuard], loadComponent: transportList, title: 'InfraTrack - Transports' },
  { path: 'nuevo', canActivate: [adminGuard, planCanAddTransportGuard], loadComponent: transportWizard, title: 'InfraTrack - New Transport' },
  { path: ':transportId', canActivate: [adminGuard], loadComponent: transportDetail, title: 'InfraTrack - Transport Detail' },
];

/** Admin — /conductores */
export const fleetDriverRoutes: Routes = [
  { path: '', canActivate: [adminGuard, planDriversGuard], loadComponent: driverList, title: 'InfraTrack - Drivers' },
  { path: ':driverId', canActivate: [adminGuard, planDriversGuard], loadComponent: driverDetail, title: 'InfraTrack - Driver Detail' },
];

/** Owner — configuración, nodos IoT y mantenimiento */
export const fleetConfigurationRoutes: Routes = [
  { path: '', canActivate: [ownerOnlyGuard], loadComponent: configurationView, title: 'InfraTrack - Configuration' },
];
