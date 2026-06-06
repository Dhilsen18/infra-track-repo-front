import { Routes } from '@angular/router';

import { iamGuard, ownerGuard } from './iam/infrastructure/iam.guard';

const shellLayout = () =>
  import('./shared/presentation/components/layout/shell-layout').then((m) => m.ShellLayout);
const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);
const siteManagementRoutes = () =>
  import('./site-management/presentation/site-management.routes').then(
    (m) => m.siteManagementRoutes,
  );

const monitoringOpsRoutes = () =>
  import('./monitoring/presentation/monitoring.routes').then((m) => m.monitoringOpsRoutes);
const monitoringOwnerDashboardRoutes = () =>
  import('./monitoring/presentation/monitoring.routes').then((m) => m.monitoringOwnerDashboardRoutes);
const monitoringTelemetryRoutes = () =>
  import('./monitoring/presentation/monitoring.routes').then((m) => m.monitoringTelemetryRoutes);
const monitoringReportsRoutes = () =>
  import('./monitoring/presentation/monitoring.routes').then((m) => m.monitoringReportsRoutes);

const fleetIotRoutes = () =>
  import('./fleet/presentation/fleet.routes').then((m) => m.fleetIotRoutes);
const fleetTransportRoutes = () =>
  import('./fleet/presentation/fleet.routes').then((m) => m.fleetTransportRoutes);
const fleetDriverRoutes = () =>
  import('./fleet/presentation/fleet.routes').then((m) => m.fleetDriverRoutes);
const fleetConfigurationRoutes = () =>
  import('./fleet/presentation/fleet.routes').then((m) => m.fleetConfigurationRoutes);

const homeRedirect = () =>
  import('./shared/presentation/views/home-redirect/home-redirect').then((m) => m.HomeRedirect);
const profilePage = () =>
  import('./shared/presentation/views/profile-page/profile-page').then((m) => m.ProfilePage);
const ownerPlansPage = () =>
  import('./iam/presentation/views/owner-plans-page/owner-plans-page').then(
    (m) => m.OwnerPlansPage,
  );

const baseTitle = 'InfraTrack';

/** Bounded contexts: iam, fleet, monitoring, site-management, shared */
export const routes: Routes = [
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'login', redirectTo: 'iam/sign-in', pathMatch: 'full' },
  {
    path: 'subscription-plans',
    canActivate: [iamGuard, ownerGuard],
    loadComponent: ownerPlansPage,
    data: { plansContext: 'profile' },
    title: `${baseTitle} - Subscription Plans`,
  },
  {
    path: '',
    loadComponent: shellLayout,
    canActivate: [iamGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: homeRedirect },

      // monitoring — telemetría, panel, alertas
      { path: 'operacion', loadChildren: monitoringOpsRoutes, title: `${baseTitle} - Operations` },
      { path: 'control-panel', loadChildren: monitoringOwnerDashboardRoutes, title: `${baseTitle} - Control Panel` },
      { path: 'telemetry', loadChildren: monitoringTelemetryRoutes, title: `${baseTitle} - Telemetry` },
      { path: 'reports-analytics', loadChildren: monitoringReportsRoutes, title: `${baseTitle} - Reports` },

      // fleet — activos, IoT, transportes, conductores, configuración
      { path: 'dispositivos', loadChildren: fleetIotRoutes, title: `${baseTitle} - IoT Devices` },
      { path: 'transportes', loadChildren: fleetTransportRoutes, title: `${baseTitle} - Transports` },
      { path: 'conductores', loadChildren: fleetDriverRoutes, title: `${baseTitle} - Drivers` },
      { path: 'configuration', loadChildren: fleetConfigurationRoutes, title: `${baseTitle} - Configuration` },

      // site-management — dueño / obras
      { path: 'obras', loadChildren: siteManagementRoutes, title: `${baseTitle} - Worksites` },

      { path: 'profile', loadComponent: profilePage, title: `${baseTitle} - Profile` },

      // Rutas legacy → nuevos contextos
      { path: 'asset-management', redirectTo: 'configuration', pathMatch: 'full' },
      { path: 'performance', redirectTo: 'conductores', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'iam/sign-in' },
];

