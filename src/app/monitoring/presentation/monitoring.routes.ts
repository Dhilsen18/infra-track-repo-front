import { Routes } from '@angular/router';

import { adminGuard, ownerOnlyGuard } from '../../iam/infrastructure/iam.guard';

const opsDashboard = () =>
  import('./views/ops-dashboard/ops-dashboard').then((m) => m.OpsDashboard);
const controlPanelView = () =>
  import('./views/control-panel-view/control-panel-view').then((m) => m.ControlPanelView);
const telemetryView = () =>
  import('./views/telemetry-view/telemetry-view').then((m) => m.TelemetryView);
const reportsView = () =>
  import('./views/reports-view/reports-view').then((m) => m.ReportsView);

/** Admin — dashboard de operación */
export const monitoringOpsRoutes: Routes = [
  { path: '', canActivate: [adminGuard], loadComponent: opsDashboard, title: 'InfraTrack - Operations Dashboard' },
];

/** Owner — panel de control */
export const monitoringOwnerDashboardRoutes: Routes = [
  { path: '', canActivate: [ownerOnlyGuard], loadComponent: controlPanelView, title: 'InfraTrack - Control Panel' },
];

/** Telemetría GPS — acceso dueño */
export const monitoringTelemetryRoutes: Routes = [
  { path: '', canActivate: [ownerOnlyGuard], loadComponent: telemetryView, title: 'InfraTrack - Telemetry' },
];

/** Informes y alertas — acceso dueño */
export const monitoringReportsRoutes: Routes = [
  { path: '', canActivate: [ownerOnlyGuard], loadComponent: reportsView, title: 'InfraTrack - Reports & Analytics' },
];
