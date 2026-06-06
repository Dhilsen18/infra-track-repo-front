import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { CONTROL_PANEL_DEMO_PAYLOAD } from '../../monitoring/infrastructure/control-panel-demo.data';
import {
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';
import { buildConfigurationDashboard, ConfigurationDashboardVm } from '../infrastructure/configuration.mapper';

const DEMO_SUBSCRIPTIONS = [{ id: 1, planName: 'Premium', status: 'active' }];

@Injectable({ providedIn: 'root' })
export class ConfigurationStore {
  readonly dashboard = signal<ConfigurationDashboardVm | null>(null);
  readonly machinery = signal<MachineryApiDto[]>([]);
  readonly iotNodes = signal<IotNodeApiDto[]>([]);
  readonly apiLoading = signal(false);
  readonly apiEmpty = signal(false);

  private readonly maintenanceRecords = signal<MaintenanceRecordApiDto[]>([]);

  httpPostEnabled(): boolean {
    return true;
  }

  httpPutDeleteEnabled(): boolean {
    return true;
  }

  loadApiSnapshot(): void {
    const payload = CONTROL_PANEL_DEMO_PAYLOAD;
    this.machinery.set(payload.machinery);
    this.iotNodes.set(payload.iotNodes);
    this.maintenanceRecords.set(payload.maintenanceRecords);
    const vm = buildConfigurationDashboard(
      payload.machinery,
      payload.iotNodes,
      payload.maintenanceRecords,
      DEMO_SUBSCRIPTIONS,
    );
    this.dashboard.set(vm);
    this.apiEmpty.set(false);
    this.apiLoading.set(false);
  }

  addIotNode(body: Omit<IotNodeApiDto, 'id'>): Observable<IotNodeApiDto> {
    const nextId = Math.max(0, ...this.iotNodes().map((n) => n.id)) + 1;
    const created: IotNodeApiDto = { ...body, id: nextId };
    this.iotNodes.update((nodes) => [...nodes, created]);
    this.rebuildDashboard();
    return of(created);
  }

  linkIotNodeToMachinery(nodeId: number, machineryId: number): Observable<IotNodeApiDto> {
    const current = this.iotNodes().find((n) => n.id === nodeId);
    if (!current) {
      return throwError(() => new Error('IOT_NODE_NOT_FOUND'));
    }
    const updated: IotNodeApiDto = { ...current, machineryId };
    this.iotNodes.update((nodes) => nodes.map((n) => (n.id === nodeId ? updated : n)));
    this.rebuildDashboard();
    return of(updated);
  }

  addMaintenanceRecord(body: Omit<MaintenanceRecordApiDto, 'id'>): Observable<MaintenanceRecordApiDto> {
    const nextId = Math.max(0, ...this.maintenanceRecords().map((r) => r.id)) + 1;
    const created: MaintenanceRecordApiDto = { ...body, id: nextId };
    this.maintenanceRecords.update((rows) => [...rows, created]);
    this.rebuildDashboard();
    return of(created);
  }

  private rebuildDashboard(): void {
    const vm = buildConfigurationDashboard(
      this.machinery(),
      this.iotNodes(),
      this.maintenanceRecords(),
      DEMO_SUBSCRIPTIONS,
    );
    this.dashboard.set(vm);
    this.apiEmpty.set(false);
  }
}
