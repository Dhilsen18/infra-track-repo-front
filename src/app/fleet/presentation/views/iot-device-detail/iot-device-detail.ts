import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { FleetStore } from '../../../application/fleet.store';
import { IotDevice } from '../../../domain/model/iot-device.entity';

interface SensorReading {
  key: string;
  value: string;
}

const DEMO_READINGS: Record<number, SensorReading[]> = {
  1: [
    { key: 'fuelLevel', value: '62 %' },
    { key: 'battery', value: '3.72 V' },
    { key: 'connection', value: 'En línea' },
    { key: 'engineTemp', value: '—' },
    { key: 'gps', value: 'Obra Vía Sur — Tramo 3' },
    { key: 'vibration', value: '0.02 m/s²' },
    { key: 'rpm', value: '—' },
    { key: 'hydraulicPressure', value: '—' },
  ],
  2: [
    { key: 'engineTemp', value: '92 °C' },
    { key: 'fuelLevel', value: '48 %' },
    { key: 'rpm', value: '1 680 RPM' },
    { key: 'battery', value: '3.55 V' },
    { key: 'connection', value: 'En línea' },
    { key: 'gps', value: 'Obra Vía Sur — Tramo 3' },
    { key: 'vibration', value: '0.11 m/s²' },
    { key: 'hydraulicPressure', value: '210 bar' },
  ],
  3: [
    { key: 'engineTemp', value: '79 °C' },
    { key: 'fuelLevel', value: '71 %' },
    { key: 'rpm', value: '980 RPM' },
    { key: 'battery', value: '3.41 V' },
    { key: 'connection', value: 'Fuera de línea' },
    { key: 'gps', value: 'Almacén Central' },
    { key: 'vibration', value: '0.04 m/s²' },
    { key: 'hydraulicPressure', value: '—' },
  ],
  4: [
    { key: 'vibration', value: '0.08 m/s²' },
    { key: 'battery', value: '3.88 V' },
    { key: 'connection', value: 'En línea' },
    { key: 'engineTemp', value: '95 °C' },
    { key: 'fuelLevel', value: '34 %' },
    { key: 'gps', value: 'Almacén Central' },
    { key: 'rpm', value: '1 320 RPM' },
    { key: 'hydraulicPressure', value: '172 bar' },
  ],
};

@Component({
  selector: 'app-iot-device-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './iot-device-detail.html',
  styleUrl: './iot-device-detail.css',
})
export class IotDeviceDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(FleetStore);

  ngOnInit(): void {
    if (!this.store.iotDevices().length) {
      this.store.loadFleet();
    }
  }

  private readonly deviceId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('deviceId')))),
    { initialValue: 0 },
  );

  protected device(): IotDevice | undefined {
    const id = this.deviceId();
    return id ? this.store.iotById(id) : undefined;
  }

  protected nodeTypeKey(nodeType: string): string {
    return `fleetOperations.iot.nodeTypes.${nodeType}`;
  }

  protected statusKey(status: string): string {
    return `fleetOperations.iot.status.${status}`;
  }

  protected sensorReadings(): SensorReading[] {
    const id = this.deviceId();
    return DEMO_READINGS[id] ?? DEMO_READINGS[1];
  }
}
