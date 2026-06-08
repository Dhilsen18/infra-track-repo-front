import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlanLimitsService } from '../../../../shared/application/plan-limits.service';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { FleetStore } from '../../../application/fleet.store';

@Component({
  selector: 'app-transport-list',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './transport-list.html',
  styleUrl: './transport-list.css',
})
export class TransportList implements OnInit {
  protected readonly store = inject(FleetStore);
  protected readonly limits = inject(PlanLimitsService);

  ngOnInit(): void {
    this.store.loadFleet();
    if (this.store.snack()) {
      setTimeout(() => this.store.clearSnack(), 4000);
    }
  }

  statusKey(status: string): string {
    return `fleetOperations.transport.status.${status}`;
  }
}
