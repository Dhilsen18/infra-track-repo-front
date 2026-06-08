import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';

import { FleetStore } from '../../../application/fleet.store';
import { FleetTransportUnitType } from '../../../domain/model/fleet-transport.entity';

type MonitorParam = 'engineTemp' | 'fuelLevel' | 'engineHours' | 'vibration' | 'gps' | 'hydraulicPressure' | 'rpm';

const UNIT_DEFAULTS: Record<FleetTransportUnitType, MonitorParam[]> = {
  dump_truck: ['engineTemp', 'fuelLevel', 'gps', 'engineHours'],
  excavator: ['engineTemp', 'fuelLevel', 'vibration', 'hydraulicPressure', 'engineHours'],
  loader: ['engineTemp', 'fuelLevel', 'rpm', 'engineHours'],
  mixer: ['engineTemp', 'fuelLevel', 'vibration', 'engineHours'],
  crane_truck: ['engineTemp', 'fuelLevel', 'gps', 'hydraulicPressure'],
};

const ALL_PARAMS: MonitorParam[] = [
  'engineTemp',
  'fuelLevel',
  'engineHours',
  'vibration',
  'gps',
  'hydraulicPressure',
  'rpm',
];

function buildParamState(active: MonitorParam[]): Record<MonitorParam, boolean> {
  return ALL_PARAMS.reduce(
    (acc, key) => {
      acc[key] = active.includes(key);
      return acc;
    },
    {} as Record<MonitorParam, boolean>,
  );
}

@Component({
  selector: 'app-transport-wizard',
  imports: [FormsModule, RouterLink, MatSlideToggle, TranslatePipe],
  templateUrl: './transport-wizard.html',
  styleUrl: './transport-wizard.css',
})
export class TransportWizard {
  protected readonly store = inject(FleetStore);
  private readonly router = inject(Router);

  protected readonly paramKeys = ALL_PARAMS;
  protected readonly unitType = signal<FleetTransportUnitType>('dump_truck');
  protected readonly tankCapacityLiters = signal(200);
  protected readonly consumptionPerHour = signal(15);
  protected readonly fuelType = signal<'diesel' | 'gasoline'>('diesel');
  protected readonly plate = signal('');
  protected readonly brand = signal('');
  protected readonly model = signal('');
  protected readonly iotNodeSerial = signal<string | null>(null);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly params = signal(buildParamState(UNIT_DEFAULTS.dump_truck));

  protected iotOptions(): string[] {
    return this.store.availableIotSerials();
  }

  onUnitTypeChange(type: FleetTransportUnitType): void {
    this.unitType.set(type);
    this.params.set(buildParamState(UNIT_DEFAULTS[type]));
  }

  toggleParam(key: MonitorParam, checked: boolean): void {
    this.params.update((current) => ({ ...current, [key]: checked }));
  }

  submit(): void {
    if (!this.plate().trim() || !this.brand().trim() || !this.model().trim()) {
      this.errorKey.set('fleetOperations.transport.wizard.errorRequired');
      return;
    }
    this.errorKey.set(null);
    this.store.addTransport(
      {
        unitType: this.unitType(),
        tankCapacityLiters: this.tankCapacityLiters(),
        consumptionPerHour: this.consumptionPerHour(),
        fuelType: this.fuelType(),
        plate: this.plate(),
        brand: this.brand(),
        model: this.model(),
        iotNodeSerial: this.iotNodeSerial(),
        imageUrl: null,
      },
      (ok) => {
        if (!ok) {
          this.errorKey.set(this.store.snack() ?? 'fleetOperations.transport.wizard.errorApi');
          return;
        }
        void this.router.navigate(['/transportes']);
      },
    );
  }
}
