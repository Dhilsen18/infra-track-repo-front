import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { SiteManagementStore } from '../../../application/site-management.store';

@Component({
  selector: 'app-worksite-resources',
  imports: [RouterLink, TranslatePipe, PageHeaderCard],
  templateUrl: './worksite-resources.html',
  styleUrl: './worksite-resources.css',
})
export class WorksiteResources {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(SiteManagementStore);

  private readonly worksiteId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('worksiteId')))),
    { initialValue: 0 },
  );

  constructor() {
    if (!this.store.worksites().length) {
      this.store.loadCatalog();
    }
    effect(() => {
      const id = this.worksiteId();
      if (id) {
        this.store.loadTransportsForWorksite(id);
      }
    });
  }

  protected worksite() {
    const id = this.worksiteId();
    return id ? this.store.worksiteById(id) : undefined;
  }

  protected staffList() {
    const id = this.worksiteId();
    return id ? this.store.staffForWorksite(id) : [];
  }

  protected transportList() {
    const id = this.worksiteId();
    return id ? this.store.transportsForWorksite(id) : [];
  }
}
