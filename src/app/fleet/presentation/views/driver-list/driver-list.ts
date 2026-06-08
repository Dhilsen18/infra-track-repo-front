import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { FleetStore } from '../../../application/fleet.store';

@Component({
  selector: 'app-driver-list',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './driver-list.html',
  styleUrl: './driver-list.css',
})
export class DriverList implements OnInit {
  protected readonly store = inject(FleetStore);

  ngOnInit(): void {
    this.store.loadFleet();
  }

  statusKey(status: string): string {
    return `fleetOperations.driver.status.${status}`;
  }
}
