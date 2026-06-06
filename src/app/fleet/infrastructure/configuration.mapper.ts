import {
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';

export interface FleetApiSummary {
  machineryTotal: number;
  machineryActive: number;
  machineryMaintenance: number;
  iotNodesTotal: number;
  iotOnline: number;
  maintenanceRecordsTotal: number;
  maintenanceDueSoon: number;
}

export interface SubscriptionRowVm {
  id: number;
  summary: string;
}

export interface ConfigurationDashboardVm {
  fleet: FleetApiSummary;
  subscriptions: SubscriptionRowVm[];
}

function countDueSoonMaintenance(records: MaintenanceRecordApiDto[], daysAhead = 30): number {
  const now = Date.now();
  const limit = now + daysAhead * 86400000;
  return records.filter((r) => {
    const t = Date.parse(String(r.nextServiceDate ?? ''));
    return Number.isFinite(t) && t >= now && t <= limit;
  }).length;
}

export function buildFleetSummary(
  machinery: MachineryApiDto[],
  iotNodes: IotNodeApiDto[],
  maintenanceRecords: MaintenanceRecordApiDto[],
): FleetApiSummary {
  const mActive = machinery.filter((m) => String(m.currentStatus).toLowerCase() === 'active').length;
  const mMaint = machinery.filter((m) => String(m.currentStatus).toLowerCase() === 'maintenance').length;
  const iotOnline = iotNodes.filter((n) => String(n.connectionStatus).toLowerCase() === 'online').length;
  return {
    machineryTotal: machinery.length,
    machineryActive: mActive,
    machineryMaintenance: mMaint,
    iotNodesTotal: iotNodes.length,
    iotOnline: iotOnline,
    maintenanceRecordsTotal: maintenanceRecords.length,
    maintenanceDueSoon: countDueSoonMaintenance(maintenanceRecords),
  };
}

export function mapSubscriptionsFromApi(rows: unknown): SubscriptionRowVm[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((r, i) => {
    if (r && typeof r === 'object' && !Array.isArray(r)) {
      const o = r as Record<string, unknown>;
      const idRaw = o['id'];
      const id = typeof idRaw === 'number' && Number.isFinite(idRaw) ? idRaw : Number(idRaw) || i + 1;
      const keys = ['plan', 'planName', 'name', 'tier', 'status', 'label', 'type'] as const;
      const bits = keys
        .map((k) => o[k])
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((s) => s.trim());
      const summary = bits.length > 0 ? bits.slice(0, 3).join(' · ') : `ID ${id}`;
      return { id, summary };
    }
    return { id: i + 1, summary: String(r).slice(0, 120) };
  });
}

export function buildConfigurationDashboard(
  machinery: MachineryApiDto[],
  iotNodes: IotNodeApiDto[],
  maintenanceRecords: MaintenanceRecordApiDto[],
  subscriptionsRaw: unknown,
): ConfigurationDashboardVm {
  return {
    fleet: buildFleetSummary(machinery, iotNodes, maintenanceRecords),
    subscriptions: mapSubscriptionsFromApi(subscriptionsRaw),
  };
}
