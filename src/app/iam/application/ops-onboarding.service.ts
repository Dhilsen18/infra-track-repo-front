import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { FleetHttp } from '../../fleet/infrastructure/fleet.http';
import { WorksitesHttp } from '../../site-management/infrastructure/worksites.http';
import { SignInResource } from '../infrastructure/sign-in-response';

export interface OpsStaffProfile {
  fullName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class OpsOnboardingService {
  private readonly worksitesHttp = inject(WorksitesHttp);
  private readonly fleetHttp = inject(FleetHttp);

  provisionStaff(resource: SignInResource, profile: OpsStaffProfile): Observable<void> {
    const userId = resource.id;
    const licenseNumber = `LIC-${userId}`;
    const payload = {
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: '',
      licenseNumber,
      status: 'active',
    };

    return forkJoin([
      this.worksitesHttp.createStaff(payload),
      this.fleetHttp.createOperator({ userId, ...payload }),
    ]).pipe(map(() => undefined));
  }
}
