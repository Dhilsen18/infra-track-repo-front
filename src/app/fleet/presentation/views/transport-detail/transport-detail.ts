import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { FleetStore } from '../../../application/fleet.store';
import { FleetTransport } from '../../../domain/model/fleet-transport.entity';

interface SensorReading {
  key: string;
  value: string;
}

const DEMO_READINGS: Record<number, SensorReading[]> = {
  1: [
    { key: 'engineTemp', value: '88 °C' },
    { key: 'fuelLevel', value: '62 %' },
    { key: 'engineHours', value: '1 240 h' },
    { key: 'vibration', value: '0.06 m/s²' },
    { key: 'gps', value: 'Obra Vía Sur — Tramo 3' },
    { key: 'hydraulicPressure', value: '185 bar' },
    { key: 'rpm', value: '1 450 RPM' },
  ],
  2: [
    { key: 'engineTemp', value: '92 °C' },
    { key: 'fuelLevel', value: '48 %' },
    { key: 'engineHours', value: '890 h' },
    { key: 'vibration', value: '0.11 m/s²' },
    { key: 'gps', value: 'Obra Vía Sur — Tramo 3' },
    { key: 'hydraulicPressure', value: '210 bar' },
    { key: 'rpm', value: '1 680 RPM' },
  ],
  3: [
    { key: 'engineTemp', value: '79 °C' },
    { key: 'fuelLevel', value: '71 %' },
    { key: 'engineHours', value: '520 h' },
    { key: 'vibration', value: '0.04 m/s²' },
    { key: 'gps', value: 'Almacén Central' },
    { key: 'hydraulicPressure', value: '—' },
    { key: 'rpm', value: '980 RPM' },
  ],
  4: [
    { key: 'engineTemp', value: '95 °C' },
    { key: 'fuelLevel', value: '34 %' },
    { key: 'engineHours', value: '1 105 h' },
    { key: 'vibration', value: '0.08 m/s²' },
    { key: 'gps', value: 'Almacén Central' },
    { key: 'hydraulicPressure', value: '172 bar' },
    { key: 'rpm', value: '1 320 RPM' },
  ],
};

@Component({
  selector: 'app-transport-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './transport-detail.html',
  styleUrl: './transport-detail.css',
})
export class TransportDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(FleetStore);

  ngOnInit(): void {
    if (!this.store.transports().length) {
      this.store.loadFleet();
    }
  }

  private readonly transportId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('transportId')))),
    { initialValue: 0 },
  );

  protected transport(): FleetTransport | undefined {
    const id = this.transportId();
    return id ? this.store.transportById(id) : undefined;
  }

  protected unitTypeKey(unitType: string): string {
    return `fleetOperations.transport.unitTypes.${unitType}`;
  }

  protected fuelKey(fuelType: string): string {
    return fuelType === 'gasoline'
      ? 'fleetOperations.transport.wizard.gasoline'
      : 'fleetOperations.transport.wizard.diesel';
  }

  protected statusKey(status: string): string {
    return `fleetOperations.transport.status.${status}`;
  }

  protected sensorReadings(): SensorReading[] {
    const id = this.transportId();
    return DEMO_READINGS[id] ?? DEMO_READINGS[1];
  }
}
