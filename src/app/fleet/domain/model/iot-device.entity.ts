export type IotConnectionStatus = 'online' | 'offline';

export type IotNodeType = 'fuel_tank' | 'engine' | 'gps' | 'vibration' | 'can_bus';

export class IotDevice {
  constructor(
    readonly id: number,
    readonly serialNumber: string,
    readonly firmwareVersion: string,
    readonly batteryVoltage: number,
    readonly connectionStatus: IotConnectionStatus,
    readonly calibrationDate: string,
    readonly linkedTransportPlate: string | null,
    readonly nodeType: IotNodeType,
    readonly installLocation: string,
    readonly fuelDropPercent: number,
    readonly fuelDropMinutes: number,
    readonly maxEngineTempC: number,
    readonly lastSeen: string,
  ) {}
}
