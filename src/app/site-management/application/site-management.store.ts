import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';

import { PlanLimitsService } from '../../shared/application/plan-limits.service';
import { Worksite, WorksiteType } from '../domain/model/worksite.entity';
import { WorksiteStaff } from '../domain/model/worksite-staff.entity';
import { WorksiteTransport } from '../domain/model/worksite-transport.entity';
import { WorksitesHttp } from '../infrastructure/worksites.http';
import {
  toCreateWorksitePayload,
  worksiteFromApi,
  worksiteStaffFromApi,
  worksiteTransportFromApi,
} from '../infrastructure/worksites.mapper';

@Injectable({ providedIn: 'root' })
export class SiteManagementStore {
  private readonly planLimits = inject(PlanLimitsService);
  private readonly worksitesHttp = inject(WorksitesHttp);

  private readonly worksitesSignal = signal<Worksite[]>([]);
  private readonly staffSignal = signal<WorksiteStaff[]>([]);
  private readonly transportsSignal = signal<WorksiteTransport[]>([]);
  private readonly assignmentStaffIdsSignal = signal<number[]>([]);
  private readonly assignmentWorksiteIdSignal = signal<number | null>(null);
  private readonly snackSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);

  readonly worksites = this.worksitesSignal.asReadonly();
  readonly staff = this.staffSignal.asReadonly();
  readonly transports = this.transportsSignal.asReadonly();
  readonly assignmentStaffIds = this.assignmentStaffIdsSignal.asReadonly();
  readonly assignmentWorksiteId = this.assignmentWorksiteIdSignal.asReadonly();
  readonly snack = this.snackSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();

  readonly activeWorksites = computed(() =>
    this.worksites().filter((w) => w.status === 'active'),
  );

  loadCatalog(): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);
    forkJoin({
      worksites: this.worksitesHttp.listWorksites(),
      staff: this.worksitesHttp.listStaff(),
    }).subscribe({
      next: ({ worksites, staff }) => {
        this.worksitesSignal.set(worksites.map(worksiteFromApi));
        this.staffSignal.set(staff.map(worksiteStaffFromApi));
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.loadErrorSignal.set('siteManagement.list.loadError');
      },
    });
  }

  loadTransportsForWorksite(worksiteId: number): void {
    this.worksitesHttp.listTransportsForWorksite(worksiteId).subscribe({
      next: (rows) => {
        const mapped = rows.map(worksiteTransportFromApi);
        const others = this.transports().filter((t) => t.worksiteId !== worksiteId);
        this.transportsSignal.set([...others, ...mapped]);
      },
      error: () => {
        this.snackSignal.set('siteManagement.resources.loadError');
      },
    });
  }

  worksiteById(id: number): Worksite | undefined {
    return this.worksites().find((w) => w.id === id);
  }

  staffById(id: number): WorksiteStaff | undefined {
    return this.staff().find((s) => s.id === id);
  }

  staffForWorksite(worksiteId: number): WorksiteStaff[] {
    return this.staff().filter((s) => s.assignedWorksiteIds.includes(worksiteId));
  }

  transportsForWorksite(worksiteId: number): WorksiteTransport[] {
    return this.transports().filter((t) => t.worksiteId === worksiteId);
  }

  transportById(id: number): WorksiteTransport | undefined {
    return this.transports().find((t) => t.id === id);
  }

  toggleAssignmentStaff(staffId: number): void {
    const current = this.assignmentStaffIdsSignal();
    this.assignmentStaffIdsSignal.set(
      current.includes(staffId) ? current.filter((id) => id !== staffId) : [...current, staffId],
    );
  }

  setAssignmentWorksite(worksiteId: number | null): void {
    this.assignmentWorksiteIdSignal.set(worksiteId);
  }

  confirmAssignment(): void {
    const siteId = this.assignmentWorksiteId();
    const staffIds = this.assignmentStaffIds();
    if (siteId == null || staffIds.length === 0) {
      this.snackSignal.set('siteManagement.assignment.errorSelection');
      return;
    }

    const calls = staffIds.map((staffId) => this.worksitesHttp.assignStaff(siteId, staffId));
    forkJoin(calls.length ? calls : [of(null)]).subscribe({
      next: () => {
        this.assignmentStaffIdsSignal.set([]);
        this.assignmentWorksiteIdSignal.set(null);
        this.snackSignal.set('siteManagement.assignment.success');
        this.loadCatalog();
      },
      error: () => {
        this.snackSignal.set('siteManagement.assignment.error');
      },
    });
  }

  addWorksite(
    input: {
      name: string;
      city: string;
      type: WorksiteType;
      address: string;
      leadEngineer: string;
      latitude?: number;
      longitude?: number;
    },
    onSuccess?: (site: Worksite) => void,
  ): void {
    if (!this.planLimits.canAddWorksite(this.worksites().length)) {
      this.snackSignal.set('planLimits.worksiteReached');
      return;
    }

    this.worksitesHttp.createWorksite(toCreateWorksitePayload(input)).subscribe({
      next: (created) => {
        const site = worksiteFromApi(created);
        this.worksitesSignal.set([...this.worksites(), site]);
        this.snackSignal.set('siteManagement.form.success');
        onSuccess?.(site);
      },
      error: () => {
        this.snackSignal.set('siteManagement.form.error');
      },
    });
  }

  clearSnack(): void {
    this.snackSignal.set(null);
  }
}
