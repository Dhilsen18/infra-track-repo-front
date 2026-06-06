import { Routes } from '@angular/router';
import { ownerGuard } from '../../iam/infrastructure/iam.guard';
import { planCanAddWorksiteGuard } from '../../shared/infrastructure/subscription/plan.guard';

const worksiteList = () =>
  import('./views/worksite-list/worksite-list').then((m) => m.WorksiteList);
const worksiteDetail = () =>
  import('./views/worksite-detail/worksite-detail').then((m) => m.WorksiteDetail);
const worksiteResources = () =>
  import('./views/worksite-resources/worksite-resources').then((m) => m.WorksiteResources);
const worksiteForm = () =>
  import('./views/worksite-form/worksite-form').then((m) => m.WorksiteForm);
const establishmentsMapView = () =>
  import('./views/establishments-map-view/establishments-map-view').then(
    (m) => m.EstablishmentsMapView,
  );
const staffAssignment = () =>
  import('./views/staff-assignment/staff-assignment').then((m) => m.StaffAssignment);
const staffDetail = () =>
  import('./views/staff-detail/staff-detail').then((m) => m.StaffDetail);
const transportDetail = () =>
  import('./views/transport-detail/transport-detail').then((m) => m.TransportDetail);

/** Owner site-management routes (/obras). */
export const siteManagementRoutes: Routes = [
  {
    path: '',
    canActivate: [ownerGuard],
    loadComponent: worksiteList,
    title: 'InfraTrack - Worksites',
  },
  {
    path: 'nueva',
    canActivate: [ownerGuard, planCanAddWorksiteGuard],
    loadComponent: worksiteForm,
    title: 'InfraTrack - New Worksite',
  },
  {
    path: 'mapa',
    canActivate: [ownerGuard],
    loadComponent: establishmentsMapView,
    title: 'InfraTrack - Map of Establishments',
  },
  {
    path: 'personal/asignar',
    canActivate: [ownerGuard],
    loadComponent: staffAssignment,
    title: 'InfraTrack - Assign Staff',
  },
  {
    path: 'personal/:staffId',
    canActivate: [ownerGuard],
    loadComponent: staffDetail,
    title: 'InfraTrack - Staff Detail',
  },
  {
    path: 'transportes/:transportId',
    canActivate: [ownerGuard],
    loadComponent: transportDetail,
    title: 'InfraTrack - Transport Detail',
  },
  {
    path: ':worksiteId/recursos',
    canActivate: [ownerGuard],
    loadComponent: worksiteResources,
    title: 'InfraTrack - Worksite Resources',
  },
  {
    path: ':worksiteId',
    canActivate: [ownerGuard],
    loadComponent: worksiteDetail,
    title: 'InfraTrack - Worksite Detail',
  },
];
