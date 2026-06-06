export type UserRole = 'admin' | 'owner' | 'technician';

export interface UserApiDto {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
}

export interface OperatorApiDto {
  id: number;
  userId: number;
  fullName: string;
  licenseNumber: string;
  phone: string;
  status: 'active' | 'inactive' | string;
}

export interface MachineryApiDto {
  id: number;
  operatorId: number;
  plateNumber: string;
  model: string;
  brand: string;
  fuelType: 'diesel' | 'gasoline' | string;
  tankCapacityLiters: number;
  currentStatus: 'active' | 'inactive' | 'maintenance' | string;
  imageUrl: string;
  createdAt: string;
}

export interface IotNodeApiDto {
  id: number;
  machineryId: number;
  nodeIdentifier: string;
  firmwareVersion: string;
  batteryVoltage: number;
  connectionStatus: 'online' | 'offline' | string;
  lastSeen: string;
}

export interface TelemetryDataApiDto {
  id: number;
  nodeId: number;
  fuelLevel: number;
  fuelLevelPct: number;
  longitude: number;
  latitude: number;
  engineHours: number;
  speedKmh: number;
  engineOn: boolean;
  recordedAt: string;
}

export type AlertType = 'fuel_theft' | 'idle_excess' | 'maintenance' | 'geofence' | string;

export interface AlertApiDto {
  id: number;
  machineryId: number;
  type: AlertType;
  severity: 'critical' | 'warning' | string;
  description: string;
  isAcknowledged: boolean;
  timestamp: string;
}

export type MaintenanceServiceType = 'oil_change' | 'filter' | 'tires' | 'general' | string;

export interface MaintenanceRecordApiDto {
  id: number;
  machineryId: number;
  serviceType: MaintenanceServiceType;
  description: string;
  costPen: number;
  engineHoursAtService: number;
  serviceDate: string;
  nextServiceDate: string;
}

/** Suscripción (MockAPI `subscriptions`). */
export interface SubscriptionApiDto {
  id: number;
  userId?: number;
  plan?: string;
  planName?: string;
  pricePen?: number;
  maxMachinery?: number;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  status?: string;
  createdAt?: string;
}
