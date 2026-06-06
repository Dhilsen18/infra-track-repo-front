import { Routes } from '@angular/router';
import { guestGuard } from '../infrastructure/iam.guard';

const loginPage = () =>
  import('./views/login-page/login-page').then((m) => m.LoginPage);
const ownerLoginPage = () =>
  import('./views/owner-login-page/owner-login-page').then((m) => m.OwnerLoginPage);
const ownerSignupPage = () =>
  import('./views/owner-signup-page/owner-signup-page').then((m) => m.OwnerSignupPage);
const ownerPlansPage = () =>
  import('./views/owner-plans-page/owner-plans-page').then((m) => m.OwnerPlansPage);
const opsLoginPage = () =>
  import('./views/ops-login-page/ops-login-page').then((m) => m.OpsLoginPage);
const opsSignupPage = () =>
  import('./views/ops-signup-page/ops-signup-page').then((m) => m.OpsSignupPage);

/** IAM presentation routes (onboarding and sign-in). */
export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: loginPage,
    title: 'InfraTrack - Access',
  },
  {
    path: 'owner/login',
    canActivate: [guestGuard],
    loadComponent: ownerLoginPage,
    title: 'InfraTrack - Owner Login',
  },
  {
    path: 'owner/signup',
    canActivate: [guestGuard],
    loadComponent: ownerSignupPage,
    title: 'InfraTrack - Owner Sign Up',
  },
  {
    path: 'owner/plans',
    canActivate: [guestGuard],
    loadComponent: ownerPlansPage,
    title: 'InfraTrack - Subscription Plans',
  },
  {
    path: 'ops/login',
    canActivate: [guestGuard],
    loadComponent: opsLoginPage,
    title: 'InfraTrack - Operations Login',
  },
  {
    path: 'ops/signup',
    canActivate: [guestGuard],
    loadComponent: opsSignupPage,
    title: 'InfraTrack - Operations Sign Up',
  },
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
];
