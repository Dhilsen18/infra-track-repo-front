import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { SiteManagementStore } from '../../../application/site-management.store';
import { WorksiteType } from '../../../domain/model/worksite.entity';

@Component({
  selector: 'app-worksite-form',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './worksite-form.html',
  styleUrl: './worksite-form.css',
})
export class WorksiteForm {
  protected readonly store = inject(SiteManagementStore);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly city = signal('');
  protected readonly type = signal<WorksiteType>('building');
  protected readonly address = signal('');
  protected readonly leadEngineer = signal('');
  protected readonly latitude = signal('');
  protected readonly longitude = signal('');
  protected readonly errorKey = signal<string | null>(null);

  submit(): void {
    if (!this.name().trim() || !this.city().trim() || !this.address().trim() || !this.leadEngineer().trim()) {
      this.errorKey.set('signup.errorRequired');
      return;
    }

    const lat = this.latitude().trim() ? Number(this.latitude()) : undefined;
    const lng = this.longitude().trim() ? Number(this.longitude()) : undefined;

    this.errorKey.set(null);
    this.store.addWorksite(
      {
        name: this.name(),
        city: this.city(),
        type: this.type(),
        address: this.address(),
        leadEngineer: this.leadEngineer(),
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      },
      (site) => {
        void this.router.navigate(['/obras/mapa'], { queryParams: { highlight: site.id } });
      },
    );
  }
}
