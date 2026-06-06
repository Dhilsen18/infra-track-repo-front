import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { SiteManagementStore } from '../../../application/site-management.store';

@Component({
  selector: 'app-staff-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './staff-detail.html',
  styleUrl: './staff-detail.css',
})
export class StaffDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(SiteManagementStore);

  private readonly staffId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('staffId')))),
    { initialValue: 0 },
  );

  protected member() {
    const id = this.staffId();
    return id ? this.store.staffById(id) : undefined;
  }

  protected assignedSites() {
    const member = this.member();
    if (!member) {
      return [];
    }
    return member.assignedWorksiteIds
      .map((id) => this.store.worksiteById(id))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }

  protected backLink(): string[] {
    const sites = this.assignedSites();
    if (sites.length) {
      return ['/obras', String(sites[0].id), 'recursos'];
    }
    return ['/obras'];
  }
}
