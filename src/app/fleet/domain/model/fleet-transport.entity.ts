export type FleetTransportStatus = 'active' | 'maintenance' | 'inactive';

export type FleetTransportUnitType = 'dump_truck' | 'excavator' | 'loader' | 'mixer' | 'crane_truck';

export class FleetTransport {
  constructor(
    readonly id: number,
    readonly plate: string,
    readonly brand: string,
    readonly model: string,
    readonly unitType: FleetTransportUnitType,
    readonly fuelType: 'diesel' | 'gasoline',
    readonly tankCapacityLiters: number,
    readonly consumptionPerHour: number,
    readonly iotNodeSerial: string | null,
    readonly status: FleetTransportStatus,
    readonly imageUrl: string | null,
  ) {}
}
