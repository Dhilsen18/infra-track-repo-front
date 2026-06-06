import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  AlertApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
  TelemetryDataApiDto,
} from '../../shared/infrastructure/infratrack-api.contracts';
import { CONTROL_PANEL_DEMO_PAYLOAD } from './control-panel-demo.data';

export interface ControlPanelDashboardPayload {
  alerts: AlertApiDto[];
  machinery: MachineryApiDto[];
  telemetryData: TelemetryDataApiDto[];
  maintenanceRecords: MaintenanceRecordApiDto[];
  iotNodes: IotNodeApiDto[];
}

@Injectable({ providedIn: 'root' })
export class ControlPanelDashboardHttp {
  loadDashboard$(): Observable<ControlPanelDashboardPayload> {
    return of(CONTROL_PANEL_DEMO_PAYLOAD);
  }

  acknowledgeAlert$(alert: AlertApiDto): Observable<AlertApiDto> {
    return of({ ...alert, isAcknowledged: true });
  }
}
