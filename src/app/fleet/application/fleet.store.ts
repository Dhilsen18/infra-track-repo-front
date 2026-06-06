import { computed, inject, Injectable, signal } from '@angular/core';

import { PlanLimitsService } from '../../shared/application/plan-limits.service';
import { FleetDriver } from '../domain/model/fleet-driver.entity';
import { FleetTransport, FleetTransportUnitType } from '../domain/model/fleet-transport.entity';
import { IotDevice, IotNodeType } from '../domain/model/iot-device.entity';

const IOT_KEY = 'infratrack_fleet_iot';
const TRANSPORT_KEY = 'infratrack_fleet_transports';

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

function seedIot(): IotDevice[] {
  return [
    new IotDevice(1, 'IOT-NODE-001', '2.4.1', 3.72, 'online', '2026-01-15', 'BCP-204', 'fuel_tank', 'Volquete BCP-204 — Tanque principal', 5, 1, 95, '2026-06-03T14:22:00Z'),
    new IotDevice(2, 'IOT-NODE-002', '2.4.0', 3.55, 'online', '2025-11-02', 'XYZ-918', 'engine', 'Excavadora XYZ-918 — Compartimento motor', 5, 1, 95, '2026-06-03T14:18:00Z'),
    new IotDevice(3, 'IOT-NODE-010', '2.3.8', 3.41, 'offline', '2025-09-20', 'LIM-442', 'can_bus', 'Mezcladora LIM-442 — Cabina operador', 4, 2, 92, '2026-06-02T09:05:00Z'),
    new IotDevice(4, 'IOT-NODE-021', '2.5.0', 3.88, 'online', '2026-02-01', 'CAT-950', 'vibration', 'Cargador CAT-950 — Estructura principal', 5, 1, 96, '2026-06-03T14:30:00Z'),
  ];
}

function parseNodeType(value: unknown): IotNodeType {
  const types: IotNodeType[] = ['fuel_tank', 'engine', 'gps', 'vibration', 'can_bus'];
  return types.includes(value as IotNodeType) ? (value as IotNodeType) : 'fuel_tank';
}

function seedTransports(): FleetTransport[] {
  return [
    new FleetTransport(1, 'BCP-204', 'Volvo', 'FH16', 'dump_truck', 'diesel', 380, 28.5, 'IOT-NODE-001', 'active', null),
    new FleetTransport(2, 'XYZ-918', 'Caterpillar', '320D', 'excavator', 'diesel', 220, 18.2, 'IOT-NODE-002', 'active', null),
    new FleetTransport(3, 'LIM-442', 'Mercedes-Benz', 'Mezcladora', 'mixer', 'diesel', 160, 12.4, 'IOT-NODE-010', 'active', null),
    new FleetTransport(4, 'CAT-950', 'Caterpillar', '950 GC', 'loader', 'diesel', 180, 15.0, 'IOT-NODE-021', 'maintenance', null),
  ];
}

function parseUnitType(value: unknown): FleetTransportUnitType {
  const types: FleetTransportUnitType[] = ['dump_truck', 'excavator', 'loader', 'mixer', 'crane_truck'];
  return types.includes(value as FleetTransportUnitType) ? (value as FleetTransportUnitType) : 'dump_truck';
}

function seedDrivers(): FleetDriver[] {
  return [
    new FleetDriver(1, 'Carlos Vizcarra', 'Q1-2045', '+51 999 111 222', 'carlos.vizcarra@infratrack.demo', 'active', 'Volquete BCP-204', 'Obra Vía Sur — Tramo 3', 2, 38, 1),
    new FleetDriver(2, 'María Solís', 'Q1-2088', '+51 999 333 444', 'maria.solis@infratrack.demo', 'active', 'Cargador CAT-950', 'Almacén Central Ferretería Norte', 0, 42, 0),
    new FleetDriver(3, 'Jorge Paredes', 'Q1-3012', '+51 999 555 666', 'jorge.paredes@infratrack.demo', 'active', 'Excavadora XYZ-918', 'Obra Vía Sur — Tramo 3', 1, 35, 1),
    new FleetDriver(4, 'Ana Torres', 'Q1-3150', '+51 999 777 888', 'ana.torres@infratrack.demo', 'inactive', null, 'Sin asignación', 0, 0, 0),
  ];
}

@Injectable({ providedIn: 'root' })
export class FleetStore {
  private readonly planLimits = inject(PlanLimitsService);
  private readonly assignedWorksite = 'Obra Vía Sur — Tramo 3';
  private readonly iotSignal = signal<IotDevice[]>(this.loadIot());
  private readonly transportsSignal = signal<FleetTransport[]>(this.loadTransports());
  private readonly driversSignal = signal<FleetDriver[]>(seedDrivers());
  private readonly snackSignal = signal<string | null>(null);
  private nextIotId = Math.max(0, ...this.iotSignal().map((d) => d.id)) + 1;
  private nextTransportId = Math.max(0, ...this.transportsSignal().map((t) => t.id)) + 1;

  readonly iotDevices = this.iotSignal.asReadonly();
  readonly transports = this.transportsSignal.asReadonly();
  readonly drivers = this.driversSignal.asReadonly();
  readonly snack = this.snackSignal.asReadonly();
  readonly worksiteLabel = this.assignedWorksite;

  readonly onlineNodes = computed(() => this.iotDevices().filter((d) => d.connectionStatus === 'online').length);
  readonly activeTransports = computed(() => this.transports().filter((t) => t.status === 'active').length);
  readonly criticalFuelAlerts = computed(() =>
    this.drivers().reduce((sum, d) => sum + d.fuelAlertsHistory, 0) + 2,
  );
  readonly engineHoursWeek = computed(() => 186);

  iotById(id: number): IotDevice | undefined {
    return this.iotDevices().find((d) => d.id === id);
  }

  previewNextIotId(): number {
    return this.nextIotId;
  }

  transportById(id: number): FleetTransport | undefined {
    return this.transports().find((t) => t.id === id);
  }

  previewNextTransportId(): number {
    return this.nextTransportId;
  }

  driverById(id: number): FleetDriver | undefined {
    return this.drivers().find((d) => d.id === id);
  }

  availableIotSerials(): string[] {
    return this.iotDevices().map((d) => d.serialNumber);
  }

  addIotDevice(draft: IotDeviceDraft): IotDevice | null {
    if (!this.planLimits.canAddIotDevice(this.iotDevices().length)) {
      this.snackSignal.set('planLimits.iotReached');
      return null;
    }
    const device = new IotDevice(
      this.nextIotId++,
      draft.serialNumber.trim(),
      draft.firmwareVersion.trim(),
      draft.batteryVoltage,
      'online',
      draft.calibrationDate,
      null,
      draft.nodeType,
      draft.installLocation.trim(),
      draft.fuelDropPercent,
      draft.fuelDropMinutes,
      draft.maxEngineTempC,
      new Date().toISOString(),
    );
    const next = [...this.iotDevices(), device];
    this.iotSignal.set(next);
    this.persistIot(next);
    this.snackSignal.set('fleetOperations.iot.wizard.success');
    return device;
  }

  addTransport(draft: FleetTransportDraft): FleetTransport | null {
    if (!this.planLimits.canAddTransport(this.transports().length)) {
      this.snackSignal.set('planLimits.transportReached');
      return null;
    }
    const transport = new FleetTransport(
      this.nextTransportId++,
      draft.plate.trim().toUpperCase(),
      draft.brand.trim(),
      draft.model.trim(),
      draft.unitType,
      draft.fuelType,
      draft.tankCapacityLiters,
      draft.consumptionPerHour,
      draft.iotNodeSerial,
      'active',
      draft.imageUrl,
    );
    const next = [...this.transports(), transport];
    this.transportsSignal.set(next);
    this.persistTransports(next);

    if (draft.iotNodeSerial) {
      this.linkIotToPlate(draft.iotNodeSerial, transport.plate);
    }

    this.snackSignal.set('fleetOperations.transport.wizard.success');
    return transport;
  }

  clearSnack(): void {
    this.snackSignal.set(null);
  }

  private linkIotToPlate(serial: string, plate: string): void {
    const next = this.iotDevices().map((d) =>
      d.serialNumber === serial ? new IotDevice(
        d.id,
        d.serialNumber,
        d.firmwareVersion,
        d.batteryVoltage,
        d.connectionStatus,
        d.calibrationDate,
        plate,
        d.nodeType,
        d.installLocation,
        d.fuelDropPercent,
        d.fuelDropMinutes,
        d.maxEngineTempC,
        d.lastSeen,
      ) : d,
    );
    this.iotSignal.set(next);
    this.persistIot(next);
  }

  private loadIot(): IotDevice[] {
    try {
      const raw = localStorage.getItem(IOT_KEY);
      if (!raw) {
        return seedIot();
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed) || !parsed.length) {
        return seedIot();
      }
      return parsed.map((row) => {
        const r = row as Record<string, unknown>;
        return new IotDevice(
          Number(r['id']),
          String(r['serialNumber']),
          String(r['firmwareVersion']),
          Number(r['batteryVoltage']),
          r['connectionStatus'] === 'offline' ? 'offline' : 'online',
          String(r['calibrationDate']),
          r['linkedTransportPlate'] ? String(r['linkedTransportPlate']) : null,
          parseNodeType(r['nodeType']),
          r['installLocation'] ? String(r['installLocation']) : 'Sin ubicación registrada',
          Number(r['fuelDropPercent']),
          Number(r['fuelDropMinutes']),
          Number(r['maxEngineTempC']),
          String(r['lastSeen']),
        );
      });
    } catch {
      return seedIot();
    }
  }

  private loadTransports(): FleetTransport[] {
    try {
      const raw = localStorage.getItem(TRANSPORT_KEY);
      if (!raw) {
        return seedTransports();
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed) || !parsed.length) {
        return seedTransports();
      }
      return parsed.map((row) => {
        const r = row as Record<string, unknown>;
        return new FleetTransport(
          Number(r['id']),
          String(r['plate']),
          String(r['brand']),
          String(r['model']),
          parseUnitType(r['unitType']),
          r['fuelType'] === 'gasoline' ? 'gasoline' : 'diesel',
          Number(r['tankCapacityLiters']),
          Number(r['consumptionPerHour']),
          r['iotNodeSerial'] ? String(r['iotNodeSerial']) : null,
          r['status'] === 'maintenance' ? 'maintenance' : r['status'] === 'inactive' ? 'inactive' : 'active',
          r['imageUrl'] ? String(r['imageUrl']) : null,
        );
      });
    } catch {
      return seedTransports();
    }
  }

  private persistIot(devices: IotDevice[]): void {
    localStorage.setItem(IOT_KEY, JSON.stringify(devices));
  }

  private persistTransports(transports: FleetTransport[]): void {
    localStorage.setItem(TRANSPORT_KEY, JSON.stringify(transports));
  }
}
