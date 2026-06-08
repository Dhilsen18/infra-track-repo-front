import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { OnboardingDraftStore } from '../../iam/application/onboarding-draft.store';
import {
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';
import { INFRATRACK_API } from '../../shared/infrastructure/infratrack-api.urls';
import { infratrackPostAllowed, infratrackPutDeleteAllowed } from '../../shared/infrastructure/infratrack-http-policy';
import { buildConfigurationDashboard, ConfigurationDashboardVm } from '../infrastructure/configuration.mapper';

interface CreateIotNodeBody {
  machineryId: number;
  nodeIdentifier: string;
  firmwareVersion: string;
  batteryVoltage: number;
  connectionStatus: string;
  lastSeen: string;
}

interface CreateMaintenanceBody {
  machineryId: number;
  serviceType: string;
  description: string;
  costPen: number;
  engineHoursAtService: number;
  serviceDate: string;
  nextServiceDate: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigurationStore {
  private readonly http = inject(HttpClient);
  private readonly onboarding = inject(OnboardingDraftStore);

  readonly dashboard = signal<ConfigurationDashboardVm | null>(null);
  readonly machinery = signal<MachineryApiDto[]>([]);
  readonly iotNodes = signal<IotNodeApiDto[]>([]);
  readonly apiLoading = signal(false);
  readonly apiEmpty = signal(false);
  readonly apiError = signal<string | null>(null);

  private readonly maintenanceRecords = signal<MaintenanceRecordApiDto[]>([]);

  httpPostEnabled(): boolean {
    return infratrackPostAllowed();
  }

  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
  }

  loadApiSnapshot(): void {
    this.apiLoading.set(true);
    this.apiError.set(null);
    forkJoin({
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery),
      iotNodes: this.http.get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes),
      maintenanceRecords: this.http.get<MaintenanceRecordApiDto[]>(INFRATRACK_API.maintenanceRecords),
    }).subscribe({
      next: ({ machinery, iotNodes, maintenanceRecords }) => {
        this.machinery.set(machinery);
        this.iotNodes.set(iotNodes);
        this.maintenanceRecords.set(maintenanceRecords);
        this.rebuildDashboard();
        this.apiEmpty.set(!machinery.length && !iotNodes.length);
        this.apiLoading.set(false);
      },
      error: () => {
        this.apiLoading.set(false);
        this.apiEmpty.set(true);
        this.apiError.set('configuration.loadError');
      },
    });
  }

  addIotNode(body: CreateIotNodeBody): Observable<IotNodeApiDto> {
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('POST_DISABLED'));
    }
    return this.http.post<IotNodeApiDto>(INFRATRACK_API.iotNodes, body).pipe(
      map((created) => {
        this.iotNodes.update((nodes) => [...nodes, created]);
        this.rebuildDashboard();
        return created;
      }),
    );
  }

  linkIotNodeToMachinery(nodeId: number, machineryId: number): Observable<IotNodeApiDto> {
    if (!infratrackPutDeleteAllowed()) {
      return throwError(() => new Error('PUT_DISABLED'));
    }
    return this.http
      .put<IotNodeApiDto>(`${INFRATRACK_API.iotNodes}/${nodeId}/machinery/${machineryId}`, null)
      .pipe(
        map((updated) => {
          this.iotNodes.update((nodes) => nodes.map((n) => (n.id === nodeId ? updated : n)));
          this.rebuildDashboard();
          return updated;
        }),
      );
  }

  addMaintenanceRecord(body: CreateMaintenanceBody): Observable<MaintenanceRecordApiDto> {
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('POST_DISABLED'));
    }
    return this.http.post<MaintenanceRecordApiDto>(INFRATRACK_API.maintenanceRecords, body).pipe(
      map((created) => {
        this.maintenanceRecords.update((rows) => [...rows, created]);
        this.rebuildDashboard();
        return created;
      }),
    );
  }

  private rebuildDashboard(): void {
    const planId = this.onboarding.selectedPlan() ?? 'premium';
    const planLabels: Record<string, string> = {
      basic: 'Básico',
      premium: 'Premium',
      enterprise: 'Enterprise',
    };
    const subscriptions = [{ id: 1, planName: planLabels[planId] ?? 'Premium', status: 'active' }];
    const vm = buildConfigurationDashboard(
      this.machinery(),
      this.iotNodes(),
      this.maintenanceRecords(),
      subscriptions,
    );
    this.dashboard.set(vm);
    this.apiEmpty.set(false);
  }
}
