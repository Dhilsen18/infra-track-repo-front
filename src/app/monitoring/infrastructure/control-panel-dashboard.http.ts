import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

import {
  AlertApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
  TelemetryDataApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';
import { INFRATRACK_API } from '../../shared/infrastructure/infratrack-api.urls';

export interface ControlPanelDashboardPayload {
  alerts: AlertApiDto[];
  machinery: MachineryApiDto[];
  telemetryData: TelemetryDataApiDto[];
  maintenanceRecords: MaintenanceRecordApiDto[];
  iotNodes: IotNodeApiDto[];
}

export interface CreateAlertBody {
  machineryId: number;
  type: string;
  severity: string;
  description: string;
  isAcknowledged: boolean;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ControlPanelDashboardHttp {
  private readonly http = inject(HttpClient);

  loadDashboard$(): Observable<ControlPanelDashboardPayload> {
    return forkJoin({
      alerts: this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts),
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery),
      telemetryData: this.http.get<TelemetryDataApiDto[]>(INFRATRACK_API.telemetryData),
      maintenanceRecords: this.http.get<MaintenanceRecordApiDto[]>(INFRATRACK_API.maintenanceRecords),
      iotNodes: this.http.get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes),
    });
  }

  listAlerts$(): Observable<AlertApiDto[]> {
    return this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts);
  }

  acknowledgeAlert$(alertId: number): Observable<unknown> {
    return this.http.post(`${INFRATRACK_API.alerts}/${alertId}/acknowledgements`, null);
  }

  createAlert$(body: CreateAlertBody): Observable<AlertApiDto> {
    return this.http.post<AlertApiDto>(INFRATRACK_API.alerts, body);
  }
}
