import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { FleetStore } from '../../../fleet/application/fleet.store';
import { SiteManagementStore } from '../../../site-management/application/site-management.store';
import { PlanLimitsService } from '../../application/plan-limits.service';

export const planDriversGuard: CanActivateFn = () => {
  const limits = inject(PlanLimitsService);
  const router = inject(Router);
  if (limits.limits().drivers) {
    return true;
  }
  return router.createUrlTree(['/operacion']);
};

export const planCanAddWorksiteGuard: CanActivateFn = () => {
  const siteStore = inject(SiteManagementStore);
  const limits = inject(PlanLimitsService);
  const router = inject(Router);
  if (limits.canAddWorksite(siteStore.worksites().length)) {
    return true;
  }
  return router.createUrlTree(['/obras']);
};

export const planCanAddTransportGuard: CanActivateFn = () => {
  const fleet = inject(FleetStore);
  const limits = inject(PlanLimitsService);
  const router = inject(Router);
  if (limits.canAddTransport(fleet.transports().length)) {
    return true;
  }
  return router.createUrlTree(['/transportes']);
};

export const planCanAddIotDeviceGuard: CanActivateFn = () => {
  const fleet = inject(FleetStore);
  const limits = inject(PlanLimitsService);
  const router = inject(Router);
  if (limits.canAddIotDevice(fleet.iotDevices().length)) {
    return true;
  }
  return router.createUrlTree(['/dispositivos']);
};
