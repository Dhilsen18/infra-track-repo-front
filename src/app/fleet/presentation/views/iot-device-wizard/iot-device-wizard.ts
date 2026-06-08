import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';

import { FleetStore } from '../../../application/fleet.store';
import { IotNodeType } from '../../../domain/model/iot-device.entity';

type MonitorParam = 'fuelLevel' | 'engineTemp' | 'battery' | 'gps' | 'vibration' | 'rpm' | 'hydraulicPressure' | 'connection';

const NODE_DEFAULTS: Record<IotNodeType, MonitorParam[]> = {
  fuel_tank: ['fuelLevel', 'battery', 'connection'],
  engine: ['engineTemp', 'fuelLevel', 'rpm', 'battery', 'connection'],
  gps: ['gps', 'battery', 'connection'],
  vibration: ['vibration', 'battery', 'connection'],
  can_bus: ['engineTemp', 'fuelLevel', 'rpm', 'hydraulicPressure', 'connection'],
};

const ALL_PARAMS: MonitorParam[] = [
  'fuelLevel',
  'engineTemp',
  'battery',
  'gps',
  'vibration',
  'rpm',
  'hydraulicPressure',
  'connection',
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
  selector: 'app-iot-device-wizard',
  imports: [FormsModule, RouterLink, MatSlideToggle, TranslatePipe],
  templateUrl: './iot-device-wizard.html',
  styleUrl: './iot-device-wizard.css',
})
export class IotDeviceWizard {
  protected readonly store = inject(FleetStore);
  private readonly router = inject(Router);

  protected readonly paramKeys = ALL_PARAMS;
  protected readonly nodeType = signal<IotNodeType>('fuel_tank');
  protected readonly installLocation = signal('');
  protected readonly fuelDropPercent = signal(5);
  protected readonly fuelDropMinutes = signal(1);
  protected readonly maxEngineTempC = signal(95);
  protected readonly serialNumber = signal('');
  protected readonly firmwareVersion = signal('2.5.0');
  protected readonly batteryVoltage = signal(3.7);
  protected readonly calibrationDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly errorKey = signal<string | null>(null);
  protected readonly params = signal(buildParamState(NODE_DEFAULTS.fuel_tank));

  onNodeTypeChange(type: IotNodeType): void {
    this.nodeType.set(type);
    this.params.set(buildParamState(NODE_DEFAULTS[type]));
  }

  toggleParam(key: MonitorParam, checked: boolean): void {
    this.params.update((current) => ({ ...current, [key]: checked }));
  }

  submit(): void {
    if (!this.serialNumber().trim() || !this.firmwareVersion().trim() || !this.installLocation().trim()) {
      this.errorKey.set('fleetOperations.iot.wizard.errorRequired');
      return;
    }
    this.errorKey.set(null);
    this.store.addIotDevice(
      {
        nodeType: this.nodeType(),
        installLocation: this.installLocation(),
        fuelDropPercent: this.fuelDropPercent(),
        fuelDropMinutes: this.fuelDropMinutes(),
        maxEngineTempC: this.maxEngineTempC(),
        serialNumber: this.serialNumber(),
        firmwareVersion: this.firmwareVersion(),
        batteryVoltage: this.batteryVoltage(),
        calibrationDate: this.calibrationDate(),
      },
      (ok) => {
        if (!ok) {
          this.errorKey.set(this.store.snack() ?? 'fleetOperations.iot.wizard.errorApi');
          return;
        }
        void this.router.navigate(['/dispositivos']);
      },
    );
  }
}
