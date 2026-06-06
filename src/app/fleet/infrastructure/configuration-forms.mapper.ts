import {
  IotNodeApiDto,
  MaintenanceRecordApiDto,
  MaintenanceServiceType,
} from '../../shared/infrastructure/infratrack-api.contracts';

export function buildCreateIotNodeBody(input: {
  machineryId: number;
  nodeIdentifier: string;
  firmwareVersion: string;
  batteryVoltage: number;
  connectionStatus: 'online' | 'offline';
  lastSeen: string;
}): Omit<IotNodeApiDto, 'id'> {
  return { ...input };
}

export function buildCreateMaintenanceBody(input: {
  machineryId: number;
  serviceType: MaintenanceServiceType;
  description: string;
  costPen: number;
  engineHoursAtService: number;
  serviceDate: string;
  nextServiceDate: string;
}): Omit<MaintenanceRecordApiDto, 'id'> {
  return { ...input };
}
