import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { FleetStore } from '../../../../fleet/application/fleet.store';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';

@Component({
  selector: 'app-ops-dashboard',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './ops-dashboard.html',
  styleUrl: './ops-dashboard.css',
})
export class OpsDashboard implements OnInit {
  protected readonly store = inject(FleetStore);

  ngOnInit(): void {
    this.store.loadFleet();
  }
}
