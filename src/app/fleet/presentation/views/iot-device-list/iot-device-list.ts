import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlanLimitsService } from '../../../../shared/application/plan-limits.service';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { FleetStore } from '../../../application/fleet.store';

@Component({
  selector: 'app-iot-device-list',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './iot-device-list.html',
  styleUrl: './iot-device-list.css',
})
export class IotDeviceList implements OnInit {
  protected readonly store = inject(FleetStore);
  protected readonly limits = inject(PlanLimitsService);

  ngOnInit(): void {
    this.store.loadFleet();
    if (this.store.snack()) {
      setTimeout(() => this.store.clearSnack(), 4000);
    }
  }

  statusKey(status: string): string {
    return `fleetOperations.iot.status.${status}`;
  }
}
