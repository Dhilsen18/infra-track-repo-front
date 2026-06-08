import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infrastructure/infratrack-api.urls';
import { infratrackPutDeleteAllowed } from '../../shared/infrastructure/infratrack-http-policy';
import {
  IotNodeApiDto,
  MachineryApiDto,
  OperatorApiDto,
  TelemetryDataApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';
import { buildGpsMachineDetail, buildGpsMapMarkers, GpsMachineDetailVm } from '../infrastructure/gps-map.mapper';

export interface OperatorWorkloadRow {
  operatorId: number;
  count: number;
  label: string;
}

/** Evita que un 404 silencioso deje el mapa vacío sin avisar al usuario. */
function trackGetArray$<T>(req: Observable<T[]>): Observable<{ ok: boolean; data: T[] }> {
  return req.pipe(
    map((data) => ({ ok: true, data })),
    catchError(() => of({ ok: false, data: [] as T[] })),
  );
}

@Injectable({ providedIn: 'root' })
export class GpsMapStore {
  private readonly http = inject(HttpClient);

  private readonly machinerySignal = signal<MachineryApiDto[]>([]);
  private readonly telemetrySignal = signal<TelemetryDataApiDto[]>([]);
  private readonly iotNodesSignal = signal<IotNodeApiDto[]>([]);
  private readonly operatorsSignal = signal<OperatorApiDto[]>([]);

  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly selectedIdSignal = signal<number | null>(null);
  private readonly assignPendingSignal = signal(false);
  private readonly assignErrorSignal = signal<string | null>(null);
  /** Aviso cuando MockAPI no tiene PUT por id y aplicamos cambio solo en memoria. */
  private readonly assignLocalNoticeSignal = signal<string | null>(null);

  readonly loading = computed(() => this.loadingSignal());
  readonly loadError = computed(() => this.errorSignal());
  readonly markers = computed(() =>
    buildGpsMapMarkers(this.machinerySignal(), this.telemetrySignal(), this.iotNodesSignal()),
  );
  readonly selectedId = computed(() => this.selectedIdSignal());
  readonly detail = computed((): GpsMachineDetailVm | null => {
    const id = this.selectedIdSignal();
    if (id == null) {
      return null;
    }
    const m = this.machinerySignal().find((x) => x.id === id);
    if (!m) {
      return null;
    }
    return buildGpsMachineDetail(m, this.telemetrySignal(), this.iotNodesSignal());
  });
  readonly operators = computed(() => this.operatorsSignal());
  readonly assignPending = computed(() => this.assignPendingSignal());
  readonly assignError = computed(() => this.assignErrorSignal());
  readonly assignLocalNotice = computed(() => this.assignLocalNoticeSignal());

  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
  }

  /** Cuántas máquinas tiene cada operador en la flota cargada (vista en vivo). */
  readonly operatorWorkload = computed((): OperatorWorkloadRow[] => {
    const machinery = this.machinerySignal();
    const ops = this.operatorsSignal();
    const counts = new Map<number, number>();
    for (const m of machinery) {
      const id = m.operatorId;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([operatorId, count]) => ({
        operatorId,
        count,
        label: ops.find((o) => o.id === operatorId)?.fullName ?? `ID ${operatorId}`,
      }))
      .sort((a, b) => b.count - a.count || a.operatorId - b.operatorId);
  });

  refresh(): void {
    const previousSelection = this.selectedIdSignal();
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.assignErrorSignal.set(null);
    this.assignLocalNoticeSignal.set(null);

    forkJoin({
      machinery: trackGetArray$(this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery)),
      telemetryData: trackGetArray$(this.http.get<TelemetryDataApiDto[]>(INFRATRACK_API.telemetryData)),
      iotNodes: trackGetArray$(this.http.get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes)),
      operators: trackGetArray$(this.http.get<OperatorApiDto[]>(INFRATRACK_API.operators)),
    }).subscribe({
      next: (r) => {
        const machinery = r.machinery.data;
        const telemetryData = r.telemetryData.data;
        const iotNodes = r.iotNodes.data;
        const operators = r.operators.data;
        this.machinerySignal.set(machinery);
        this.telemetrySignal.set(telemetryData);
        this.iotNodesSignal.set(iotNodes);
        this.operatorsSignal.set(operators);
        this.loadingSignal.set(false);
        if (!r.machinery.ok) {
          this.errorSignal.set('telemetry.map.loadError');
        } else if (!r.telemetryData.ok || !r.iotNodes.ok || !r.operators.ok) {
          this.errorSignal.set('telemetry.map.loadPartial');
        } else {
          this.errorSignal.set(null);
        }
        if (previousSelection != null && !machinery.some((x) => x.id === previousSelection)) {
          this.selectedIdSignal.set(null);
        }
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('telemetry.map.loadError');
      },
    });
  }

  selectMachinery(id: number | null): void {
    this.selectedIdSignal.set(id);
    this.assignErrorSignal.set(null);
  }

  assignOperator(machineryId: number, operatorId: number): void {
    if (!infratrackPutDeleteAllowed()) {
      return;
    }
    const m = this.machinerySignal().find((x) => x.id === machineryId);
    if (!m || m.operatorId === operatorId) {
      return;
    }
    this.assignPendingSignal.set(true);
    this.assignErrorSignal.set(null);
    this.assignLocalNoticeSignal.set(null);
    const url = `${INFRATRACK_API.machinery}/${machineryId}`;
    this.http
      .put<MachineryApiDto>(url, {
        operatorId,
        currentStatus: m.currentStatus,
      })
      .subscribe({
        next: (updated) => {
          this.machinerySignal.update((list) =>
            list.map((x) => (x.id === machineryId ? { ...x, ...updated } : x)),
          );
          this.assignPendingSignal.set(false);
        },
        error: () => {
          this.assignPendingSignal.set(false);
          this.assignErrorSignal.set('telemetry.map.assignError');
        },
      });
  }
}
