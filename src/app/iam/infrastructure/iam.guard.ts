import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

/**
 * Blocks protected routes when no authenticated IAM session exists.
 */
export const iamGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (store.isSignedIn()) {
    return true;
  }
  return router.createUrlTree(['/iam/sign-in']);
};

/**
 * Redirects authenticated users away from guest-only routes.
 */
export const guestGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (!store.isSignedIn()) {
    return true;
  }
  const target = store.role() === 'admin' ? '/operacion' : '/control-panel';
  return router.createUrlTree([target]);
};

/**
 * Allows only users with role `admin` (logistics operator).
 */
export const adminGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (store.role() === 'admin') {
    return true;
  }
  return router.parseUrl('/control-panel');
};

/**
 * Allows only users with role `owner`.
 */
export const ownerGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (store.role() === 'owner') {
    return true;
  }
  return router.parseUrl('/profile');
};

/**
 * Restricts control-panel and legacy shared modules to company owners.
 */
export const ownerOnlyGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (store.role() === 'owner') {
    return true;
  }
  return router.createUrlTree(['/operacion']);
};
