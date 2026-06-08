import { Worksite, WorksiteStatus, WorksiteType } from '../domain/model/worksite.entity';
import { WorksiteStaff } from '../domain/model/worksite-staff.entity';
import { WorksiteTransport } from '../domain/model/worksite-transport.entity';

export interface WorksiteApiDto {
  id: number;
  name: string;
  city: string;
  type: string;
  status: string;
  address: string;
  leadEngineer: string;
  transportCount: number;
  staffCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateWorksiteApiDto {
  name: string;
  city: string;
  type: string;
  status: string;
  address: string;
  leadEngineer: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WorksiteStaffApiDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
  assignedWorksiteIds: number[];
  alertsLast30Days: number;
  drivingHoursWeek: number;
  currentVehicle?: string | null;
}

export interface CreateWorksiteStaffApiDto {
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
}

export interface WorksiteTransportApiDto {
  id: number;
  worksiteId: number;
  plateNumber: string;
  model: string;
  brand: string;
  iotNodeId: string;
  gpsLabel: string;
  fuelLevelPercent: number;
  status: string;
}

const WORKSITE_TYPES: WorksiteType[] = ['road', 'building', 'warehouse'];
const WORKSITE_STATUSES: WorksiteStatus[] = ['active', 'finished'];

function parseWorksiteType(value: string): WorksiteType {
  return WORKSITE_TYPES.includes(value as WorksiteType) ? (value as WorksiteType) : 'building';
}

function parseWorksiteStatus(value: string): WorksiteStatus {
  return WORKSITE_STATUSES.includes(value as WorksiteStatus) ? (value as WorksiteStatus) : 'active';
}

export function worksiteFromApi(dto: WorksiteApiDto): Worksite {
  return new Worksite(
    dto.id,
    dto.name,
    dto.city,
    parseWorksiteType(dto.type),
    parseWorksiteStatus(dto.status),
    dto.address,
    dto.leadEngineer,
    dto.transportCount ?? 0,
    dto.staffCount ?? 0,
    dto.latitude ?? undefined,
    dto.longitude ?? undefined,
  );
}

export function worksiteStaffFromApi(dto: WorksiteStaffApiDto): WorksiteStaff {
  return new WorksiteStaff(
    dto.id,
    dto.fullName,
    dto.email,
    dto.phone,
    dto.licenseNumber,
    dto.status === 'inactive' ? 'inactive' : 'active',
    dto.assignedWorksiteIds ?? [],
    dto.alertsLast30Days ?? 0,
    dto.drivingHoursWeek ?? 0,
    dto.currentVehicle ?? undefined,
  );
}

export function worksiteTransportFromApi(dto: WorksiteTransportApiDto): WorksiteTransport {
  const status =
    dto.status === 'maintenance' ? 'maintenance' : dto.status === 'inactive' ? 'inactive' : 'active';
  return new WorksiteTransport(
    dto.id,
    dto.worksiteId,
    dto.plateNumber,
    dto.model,
    dto.brand,
    dto.iotNodeId ?? '—',
    dto.gpsLabel ?? '—',
    dto.fuelLevelPercent ?? 0,
    status,
  );
}

export function toCreateWorksitePayload(input: {
  name: string;
  city: string;
  type: WorksiteType;
  address: string;
  leadEngineer: string;
  latitude?: number;
  longitude?: number;
}): CreateWorksiteApiDto {
  return {
    name: input.name.trim(),
    city: input.city.trim(),
    type: input.type,
    status: 'active',
    address: input.address.trim(),
    leadEngineer: input.leadEngineer.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };
}
