import { IotNodeApiDto, MachineryApiDto, TelemetryDataApiDto } from '../../shared/infrastructure/infratrack-api.contracts';

export interface GpsMapMarkerVm {
  machineryId: number;
  lat: number;
  lng: number;
  title: string;
  status: string;
}

export interface GpsMachineDetailVm {
  machinery: MachineryApiDto;
  fuelLevelPct: number | null;
  fuelLevelRaw: number | null;
  engineHours: number | null;
  speedKmh: number | null;
  recordedAt: string | null;
  nodes: IotNodeApiDto[];
}

function validCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function latestTelemetryByNode(telemetry: TelemetryDataApiDto[]): Map<number, TelemetryDataApiDto> {
  const sorted = [...telemetry].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
  const map = new Map<number, TelemetryDataApiDto>();
  for (const t of sorted) {
    if (!map.has(t.nodeId)) {
      map.set(t.nodeId, t);
    }
  }
  return map;
}

function fallbackCoords(m: MachineryApiDto): { lat: number; lng: number } {
  const seed = ((m.id * 9301 + 49297) % 233280) / 233280;
  const seed2 = ((m.id * 7919 + 1) % 99991) / 99991;
  return {
    lat: -12.056 + seed * 0.12 - 0.06,
    lng: -77.042 + seed2 * 0.12 - 0.06,
  };
}

export function buildGpsMapMarkers(
  machinery: MachineryApiDto[],
  telemetry: TelemetryDataApiDto[],
  iotNodes: IotNodeApiDto[],
): GpsMapMarkerVm[] {
  const latestByNode = latestTelemetryByNode(telemetry);
  return machinery.map((m) => {
    const nodes = iotNodes.filter((n) => n.machineryId === m.id);
    let best: TelemetryDataApiDto | null = null;
    for (const n of nodes) {
      const t = latestByNode.get(n.id);
      if (t && validCoord(t.latitude, t.longitude)) {
        if (!best || new Date(t.recordedAt).getTime() > new Date(best.recordedAt).getTime()) {
          best = t;
        }
      }
    }
    const title = `${m.brand} ${m.model}`;
    if (best) {
      return {
        machineryId: m.id,
        lat: best.latitude,
        lng: best.longitude,
        title,
        status: m.currentStatus,
      };
    }
    const fb = fallbackCoords(m);
    return { machineryId: m.id, lat: fb.lat, lng: fb.lng, title, status: m.currentStatus };
  });
}

export function buildGpsMachineDetail(
  m: MachineryApiDto,
  telemetry: TelemetryDataApiDto[],
  iotNodes: IotNodeApiDto[],
): GpsMachineDetailVm {
  const nodes = iotNodes.filter((n) => n.machineryId === m.id);
  const latestByNode = latestTelemetryByNode(telemetry);
  let best: TelemetryDataApiDto | null = null;
  for (const n of nodes) {
    const t = latestByNode.get(n.id);
    if (t) {
      if (!best || new Date(t.recordedAt).getTime() > new Date(best.recordedAt).getTime()) {
        best = t;
      }
    }
  }
  return {
    machinery: m,
    fuelLevelPct: best?.fuelLevelPct ?? null,
    fuelLevelRaw: best?.fuelLevel ?? null,
    engineHours: best?.engineHours ?? null,
    speedKmh: best?.speedKmh ?? null,
    recordedAt: best?.recordedAt ?? null,
    nodes,
  };
}
