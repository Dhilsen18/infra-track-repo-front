import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  readonly dateRange = signal<string>('last30');
  readonly project = signal<string>('all');
  readonly machine = signal<string>('all');

  setDateRange(value: string): void {
    this.dateRange.set(value);
  }

  setProject(value: string): void {
    this.project.set(value);
  }

  setMachine(value: string): void {
    this.machine.set(value);
  }
}
