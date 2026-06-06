import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import { SiteManagementStore } from '../../../application/site-management.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-worksite-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './worksite-detail.html',
  styleUrl: './worksite-detail.css',
})
export class WorksiteDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(SiteManagementStore);

  private readonly worksiteId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('worksiteId')))),
    { initialValue: 0 },
  );

  protected worksite() {
    const id = this.worksiteId();
    return id ? this.store.worksiteById(id) : undefined;
  }

  goResources(): void {
    const id = this.worksiteId();
    if (id) {
      void this.router.navigate(['/obras', id, 'recursos']);
    }
  }
}
