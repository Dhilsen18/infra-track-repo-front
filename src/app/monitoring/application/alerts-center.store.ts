import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';
import { AlertApiDto } from '../../shared/infrastructure/infratrack-api.contracts';
import { CONTROL_PANEL_DEMO_PAYLOAD } from '../infrastructure/control-panel-demo.data';

export type AlertSeverityFilter = 'all' | 'critical' | 'warning';
export type AlertTypeFilter = 'all' | 'fuel_theft' | 'idle_excess' | 'maintenance' | 'geofence';
export type AlertAckFilter = 'all' | 'ack' | 'pending';

@Injectable({ providedIn: 'root' })
export class AlertsCenterStore {
  private readonly iam = inject(IamStore);

  private readonly rows = signal<AlertApiDto[]>([...CONTROL_PANEL_DEMO_PAYLOAD.alerts]);
  private readonly loadingSig = signal(false);
  private readonly loadErrorSig = signal<string | null>(null);

  private readonly severityFilter = signal<AlertSeverityFilter>('all');
  private readonly typeFilter = signal<AlertTypeFilter>('all');
  private readonly ackFilter = signal<AlertAckFilter>('all');

  readonly loading = computed(() => this.loadingSig());
  readonly loadError = computed(() => this.loadErrorSig());
  readonly severityFilterValue = computed(() => this.severityFilter());
  readonly typeFilterValue = computed(() => this.typeFilter());
  readonly ackFilterValue = computed(() => this.ackFilter());

  readonly isOwner = computed(() => this.iam.role() === 'owner');
  readonly isAdmin = computed(() => this.iam.role() === 'admin');
  readonly canAcknowledge = computed(() => this.iam.isAuthenticated());

  httpPutDeleteEnabled(): boolean {
    return true;
  }

  httpPostEnabled(): boolean {
    return false;
  }

  readonly filteredRows = computed((): AlertApiDto[] => {
    let list = this.rows();
    if (this.isOwner()) {
      list = list.filter((a) => String(a.severity).toLowerCase() === 'critical');
    }
    const sev = this.severityFilter();
    const typ = this.typeFilter();
    const ack = this.ackFilter();

    if (!this.isOwner() && sev !== 'all') {
      list = list.filter((a) => String(a.severity).toLowerCase() === sev);
    }
    if (typ !== 'all') {
      list = list.filter((a) => String(a.type).toLowerCase() === typ);
    }
    if (ack === 'ack') {
      list = list.filter((a) => a.isAcknowledged);
    } else if (ack === 'pending') {
      list = list.filter((a) => !a.isAcknowledged);
    }

    return [...list].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  });

  setSeverityFilter(v: AlertSeverityFilter): void {
    this.severityFilter.set(v);
  }

  setTypeFilter(v: AlertTypeFilter): void {
    this.typeFilter.set(v);
  }

  setAckFilter(v: AlertAckFilter): void {
    this.ackFilter.set(v);
  }

  load(): Observable<AlertApiDto[]> {
    this.loadingSig.set(false);
    this.loadErrorSig.set(null);
    return of(this.rows());
  }

  acknowledge(alert: AlertApiDto, isAcknowledged: boolean): Observable<{ localOnly: boolean }> {
    this.rows.update((rows) =>
      rows.map((a) => (a.id === alert.id ? { ...a, isAcknowledged } : a)),
    );
    return of({ localOnly: false });
  }

  createAlert(payload: Omit<AlertApiDto, 'id'>): Observable<AlertApiDto> {
    const nextId = Math.max(0, ...this.rows().map((a) => a.id)) + 1;
    const created: AlertApiDto = { ...payload, id: nextId };
    this.rows.update((rows) => [created, ...rows]);
    return of(created);
  }
}
