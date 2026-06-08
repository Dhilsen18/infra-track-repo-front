import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { FleetStore } from '../../../application/fleet.store';

@Component({
  selector: 'app-driver-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './driver-detail.html',
  styleUrl: './driver-detail.css',
})
export class DriverDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(FleetStore);

  protected readonly driverId = Number(this.route.snapshot.paramMap.get('driverId'));

  ngOnInit(): void {
    if (!this.store.drivers().length) {
      this.store.loadFleet();
    }
  }

  protected readonly driver = () => this.store.driverById(this.driverId);

  statusKey(status: string): string {
    return `fleetOperations.driver.status.${status}`;
  }
}
