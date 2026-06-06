export type FleetDriverStatus = 'active' | 'inactive';

export class FleetDriver {
  constructor(
    readonly id: number,
    readonly fullName: string,
    readonly licenseNumber: string,
    readonly phone: string,
    readonly email: string,
    readonly status: FleetDriverStatus,
    readonly currentVehicle: string | null,
    readonly assignedWorksite: string,
    readonly alertsLast30Days: number,
    readonly drivingHoursWeek: number,
    readonly fuelAlertsHistory: number,
  ) {}
}
