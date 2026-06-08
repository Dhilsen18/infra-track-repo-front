import { FleetDriver, FleetDriverStatus } from '../domain/model/fleet-driver.entity';
import {
  FleetTransport,
  FleetTransportStatus,
  FleetTransportUnitType,
} from '../domain/model/fleet-transport.entity';
import { IotConnectionStatus, IotDevice, IotNodeType } from '../domain/model/iot-device.entity';

export interface MachineryApiDto {
  id: number;
  operatorId: number;
  plateNumber: string;
  model: string;
  brand: string;
  fuelType: string;
  tankCapacityLiters: number;
  currentStatus: string;
  imageUrl: string;
  createdAt: string;
}

export interface CreateMachineryApiDto {
  operatorId: number;
  plateNumber: string;
  model: string;
  brand: string;
  fuelType: string;
  tankCapacityLiters: number;
  currentStatus: string;
  imageUrl: string;
}

export interface OperatorApiDto {
  id: number;
  userId: number;
  fullName: string;
  licenseNumber: string;
  phone: string;
  status: string;
}

export interface CreateOperatorApiDto {
  userId: number;
  fullName: string;
  licenseNumber: string;
  phone: string;
  status: string;
}

export interface IotNodeApiDto {
  id: number;
  machineryId: number;
  nodeIdentifier: string;
  firmwareVersion: string;
  batteryVoltage: number;
  connectionStatus: string;
  lastSeen: string;
}

export interface CreateIotNodeApiDto {
  machineryId: number;
  nodeIdentifier: string;
  firmwareVersion: string;
  batteryVoltage: number;
  connectionStatus: string;
  lastSeen: string;
}

const TRANSPORT_STATUSES: FleetTransportStatus[] = ['active', 'maintenance', 'inactive'];
const DRIVER_STATUSES: FleetDriverStatus[] = ['active', 'inactive'];
const NODE_TYPES: IotNodeType[] = ['fuel_tank', 'engine', 'gps', 'vibration', 'can_bus'];

function parseTransportStatus(value: string): FleetTransportStatus {
  return TRANSPORT_STATUSES.includes(value as FleetTransportStatus)
    ? (value as FleetTransportStatus)
    : 'active';
}

function parseDriverStatus(value: string): FleetDriverStatus {
  return DRIVER_STATUSES.includes(value as FleetDriverStatus)
    ? (value as FleetDriverStatus)
    : 'active';
}

function parseConnectionStatus(value: string): IotConnectionStatus {
  return value === 'offline' ? 'offline' : 'online';
}

function plateByMachineryId(
  machineryId: number,
  machinery: MachineryApiDto[],
): string | null {
  return machinery.find((m) => m.id === machineryId)?.plateNumber ?? null;
}

function iotSerialByMachineryId(
  machineryId: number,
  iotNodes: IotNodeApiDto[],
): string | null {
  return iotNodes.find((n) => n.machineryId === machineryId)?.nodeIdentifier ?? null;
}

export function transportFromApi(
  dto: MachineryApiDto,
  iotNodes: IotNodeApiDto[],
): FleetTransport {
  return new FleetTransport(
    dto.id,
    dto.plateNumber,
    dto.brand,
    dto.model,
    'dump_truck',
    dto.fuelType === 'gasoline' ? 'gasoline' : 'diesel',
    dto.tankCapacityLiters,
    0,
    iotSerialByMachineryId(dto.id, iotNodes),
    parseTransportStatus(dto.currentStatus),
    dto.imageUrl || null,
  );
}

export function iotFromApi(
  dto: IotNodeApiDto,
  machinery: MachineryApiDto[],
): IotDevice {
  const plate = plateByMachineryId(dto.machineryId, machinery);
  return new IotDevice(
    dto.id,
    dto.nodeIdentifier,
    dto.firmwareVersion,
    dto.batteryVoltage,
    parseConnectionStatus(dto.connectionStatus),
    dto.lastSeen.slice(0, 10),
    plate,
    'fuel_tank',
    plate ? `${plate} — Nodo ${dto.nodeIdentifier}` : 'Sin ubicación registrada',
    5,
    1,
    95,
    dto.lastSeen,
  );
}

export function driverFromApi(
  dto: OperatorApiDto,
  machinery: MachineryApiDto[],
): FleetDriver {
  const vehicle = machinery.find((m) => m.operatorId === dto.id);
  return new FleetDriver(
    dto.id,
    dto.fullName,
    dto.licenseNumber,
    dto.phone,
    '',
    parseDriverStatus(dto.status),
    vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})` : null,
    '—',
    0,
    0,
    0,
  );
}

export function toCreateMachineryPayload(
  draft: {
    plate: string;
    brand: string;
    model: string;
    fuelType: 'diesel' | 'gasoline';
    tankCapacityLiters: number;
    imageUrl: string | null;
  },
  operatorId: number,
): CreateMachineryApiDto {
  return {
    operatorId,
    plateNumber: draft.plate.trim().toUpperCase(),
    model: draft.model.trim(),
    brand: draft.brand.trim(),
    fuelType: draft.fuelType,
    tankCapacityLiters: draft.tankCapacityLiters,
    currentStatus: 'active',
    imageUrl: draft.imageUrl ?? '',
  };
}

export function toCreateIotNodePayload(
  draft: {
    serialNumber: string;
    firmwareVersion: string;
    batteryVoltage: number;
  },
  machineryId: number,
): CreateIotNodeApiDto {
  return {
    machineryId,
    nodeIdentifier: draft.serialNumber.trim(),
    firmwareVersion: draft.firmwareVersion.trim(),
    batteryVoltage: draft.batteryVoltage,
    connectionStatus: 'online',
    lastSeen: new Date().toISOString(),
  };
}
