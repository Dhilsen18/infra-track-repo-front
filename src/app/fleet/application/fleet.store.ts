import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { PlanLimitsService } from '../../shared/application/plan-limits.service';
import { FleetDriver } from '../domain/model/fleet-driver.entity';
import { FleetTransport, FleetTransportUnitType } from '../domain/model/fleet-transport.entity';
import { IotDevice, IotNodeType } from '../domain/model/iot-device.entity';
import { FleetHttp } from '../infrastructure/fleet.http';
import {
  driverFromApi,
  IotNodeApiDto,
  MachineryApiDto,
  toCreateIotNodePayload,
  toCreateMachineryPayload,
  transportFromApi,
  iotFromApi,
} from '../infrastructure/fleet.mapper';

export interface IotDeviceDraft {
  nodeType: IotNodeType;
  installLocation: string;
  fuelDropPercent: number;
  fuelDropMinutes: number;
  maxEngineTempC: number;
  serialNumber: string;
  firmwareVersion: string;
  batteryVoltage: number;
  calibrationDate: string;
}

export interface FleetTransportDraft {
  unitType: FleetTransportUnitType;
  tankCapacityLiters: number;
  consumptionPerHour: number;
  fuelType: 'diesel' | 'gasoline';
  plate: string;
  brand: string;
  model: string;
  iotNodeSerial: string | null;
  imageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class FleetStore {
  private readonly planLimits = inject(PlanLimitsService);
  private readonly fleetHttp = inject(FleetHttp);

  private readonly iotSignal = signal<IotDevice[]>([]);
  private readonly transportsSignal = signal<FleetTransport[]>([]);
  private readonly driversSignal = signal<FleetDriver[]>([]);
  private readonly snackSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);
  private rawMachinery: MachineryApiDto[] = [];
  private rawIotNodes: IotNodeApiDto[] = [];

  readonly iotDevices = this.iotSignal.asReadonly();
  readonly transports = this.transportsSignal.asReadonly();
  readonly drivers = this.driversSignal.asReadonly();
  readonly snack = this.snackSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();
  readonly worksiteLabel = '—';

  readonly onlineNodes = computed(() => this.iotDevices().filter((d) => d.connectionStatus === 'online').length);
  readonly activeTransports = computed(() => this.transports().filter((t) => t.status === 'active').length);
  readonly criticalFuelAlerts = computed(() =>
    this.drivers().reduce((sum, d) => sum + d.fuelAlertsHistory, 0),
  );
  readonly engineHoursWeek = computed(() =>
    this.drivers().reduce((sum, d) => sum + d.drivingHoursWeek, 0),
  );

  loadFleet(): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);
    forkJoin({
      machinery: this.fleetHttp.listMachinery(),
      operators: this.fleetHttp.listOperators(),
      iotNodes: this.fleetHttp.listIotNodes(),
    }).subscribe({
      next: ({ machinery, operators, iotNodes }) => {
        this.rawMachinery = machinery;
        this.rawIotNodes = iotNodes;
        this.transportsSignal.set(machinery.map((m) => transportFromApi(m, iotNodes)));
        this.iotSignal.set(iotNodes.map((n) => iotFromApi(n, machinery)));
        this.driversSignal.set(operators.map((o) => driverFromApi(o, machinery)));
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.loadErrorSignal.set('fleetOperations.loadError');
      },
    });
  }

  iotById(id: number): IotDevice | undefined {
    return this.iotDevices().find((d) => d.id === id);
  }

  previewNextIotId(): string {
    const next = Math.max(0, ...this.iotDevices().map((d) => d.id)) + 1;
    return next > 0 ? String(next) : '—';
  }

  transportById(id: number): FleetTransport | undefined {
    return this.transports().find((t) => t.id === id);
  }

  previewNextTransportId(): string {
    const next = Math.max(0, ...this.transports().map((t) => t.id)) + 1;
    return next > 0 ? String(next) : '—';
  }

  driverById(id: number): FleetDriver | undefined {
    return this.drivers().find((d) => d.id === id);
  }

  availableIotSerials(): string[] {
    return this.iotDevices().map((d) => d.serialNumber);
  }

  addIotDevice(draft: IotDeviceDraft, onDone?: (ok: boolean) => void): void {
    if (!this.planLimits.canAddIotDevice(this.iotDevices().length)) {
      this.snackSignal.set('planLimits.iotReached');
      onDone?.(false);
      return;
    }

    const machineryId = this.findMachineryWithoutIot();
    if (!machineryId) {
      this.snackSignal.set('fleetOperations.iot.wizard.errorNoMachinery');
      onDone?.(false);
      return;
    }

    this.fleetHttp
      .createIotNode(toCreateIotNodePayload(draft, machineryId))
      .subscribe({
        next: () => {
          this.loadFleet();
          this.snackSignal.set('fleetOperations.iot.wizard.success');
          onDone?.(true);
        },
        error: () => {
          this.snackSignal.set('fleetOperations.iot.wizard.errorApi');
          onDone?.(false);
        },
      });
  }

  addTransport(draft: FleetTransportDraft, onDone?: (ok: boolean) => void): void {
    if (!this.planLimits.canAddTransport(this.transports().length)) {
      this.snackSignal.set('planLimits.transportReached');
      onDone?.(false);
      return;
    }

    const operatorId = this.drivers()[0]?.id;
    if (!operatorId) {
      this.snackSignal.set('fleetOperations.transport.wizard.errorNoOperator');
      onDone?.(false);
      return;
    }

    this.fleetHttp
      .createMachinery(toCreateMachineryPayload(draft, operatorId))
      .pipe(
        switchMap((created) => {
          const serial = draft.iotNodeSerial?.trim();
          if (!serial) {
            return of(created);
          }
          const node = this.rawIotNodes.find((n) => n.nodeIdentifier === serial);
          if (!node) {
            return of(created);
          }
          return this.fleetHttp.linkIotToMachinery(node.id, created.id).pipe(switchMap(() => of(created)));
        }),
      )
      .subscribe({
        next: () => {
          this.loadFleet();
          this.snackSignal.set('fleetOperations.transport.wizard.success');
          onDone?.(true);
        },
        error: () => {
          this.snackSignal.set('fleetOperations.transport.wizard.errorApi');
          onDone?.(false);
        },
      });
  }

  clearSnack(): void {
    this.snackSignal.set(null);
  }

  private findMachineryWithoutIot(): number | null {
    const linked = new Set(this.rawIotNodes.map((n) => n.machineryId));
    const candidate = this.rawMachinery.find((m) => !linked.has(m.id));
    return candidate?.id ?? null;
  }
}
