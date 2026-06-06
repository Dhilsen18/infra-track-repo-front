import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { SiteManagementStore } from '../../../application/site-management.store';

@Component({
  selector: 'app-transport-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './transport-detail.html',
  styleUrl: './transport-detail.css',
})
export class TransportDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(SiteManagementStore);

  private readonly transportId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('transportId')))),
    { initialValue: 0 },
  );

  protected unit() {
    const id = this.transportId();
    return id ? this.store.transportById(id) : undefined;
  }

  protected worksite() {
    const unit = this.unit();
    return unit ? this.store.worksiteById(unit.worksiteId) : undefined;
  }

  protected backLink(): string[] {
    const unit = this.unit();
    if (unit) {
      return ['/obras', String(unit.worksiteId), 'recursos'];
    }
    return ['/obras'];
  }
}
