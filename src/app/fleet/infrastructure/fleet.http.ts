import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateIotNodeApiDto,
  CreateMachineryApiDto,
  CreateOperatorApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  OperatorApiDto,
} from './fleet.mapper';

@Injectable({ providedIn: 'root' })
export class FleetHttp {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listMachinery(): Observable<MachineryApiDto[]> {
    return this.http.get<MachineryApiDto[]>(`${this.base}/machinery`);
  }

  createMachinery(body: CreateMachineryApiDto): Observable<MachineryApiDto> {
    return this.http.post<MachineryApiDto>(`${this.base}/machinery`, body);
  }

  listOperators(): Observable<OperatorApiDto[]> {
    return this.http.get<OperatorApiDto[]>(`${this.base}/operators`);
  }

  createOperator(body: CreateOperatorApiDto): Observable<OperatorApiDto> {
    return this.http.post<OperatorApiDto>(`${this.base}/operators`, body);
  }

  listIotNodes(): Observable<IotNodeApiDto[]> {
    return this.http.get<IotNodeApiDto[]>(`${this.base}/iotNodes`);
  }

  createIotNode(body: CreateIotNodeApiDto): Observable<IotNodeApiDto> {
    return this.http.post<IotNodeApiDto>(`${this.base}/iotNodes`, body);
  }

  linkIotToMachinery(iotNodeId: number, machineryId: number): Observable<IotNodeApiDto> {
    return this.http.put<IotNodeApiDto>(
      `${this.base}/iotNodes/${iotNodeId}/machinery/${machineryId}`,
      null,
    );
  }
}
