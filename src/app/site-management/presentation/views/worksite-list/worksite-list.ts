import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlanLimitsService } from '../../../../shared/application/plan-limits.service';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { SiteManagementStore } from '../../../application/site-management.store';
import { WorksiteType } from '../../../domain/model/worksite.entity';

@Component({
  selector: 'app-worksite-list',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './worksite-list.html',
  styleUrl: './worksite-list.css',
})
export class WorksiteList implements OnInit {
  protected readonly store = inject(SiteManagementStore);
  protected readonly limits = inject(PlanLimitsService);

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  readonly activeCount = computed(
    () => this.store.worksites().filter((w) => w.status === 'active').length,
  );

  readonly transportCount = computed(() =>
    this.store.worksites().reduce((sum, w) => sum + w.transportCount, 0),
  );

  typeKey(type: WorksiteType): string {
    return `siteManagement.types.${type}`;
  }

  statusKey(status: string): string {
    return `siteManagement.status.${status}`;
  }
}
