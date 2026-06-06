import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, take } from 'rxjs';

import { IamStore } from '../../../../iam/application/iam.store';
import { IotNodeApiDto } from '../../../../shared/infrastructure/infratrack-api.contracts';
import { ConfigurationStore } from '../../../application/configuration.store';
import { AddIotNodeDialog } from '../add-iot-node-dialog/add-iot-node-dialog';
import { AddMaintenanceDialog } from '../add-maintenance-dialog/add-maintenance-dialog';

@Component({
  selector: 'app-configuration-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  templateUrl: './configuration-view.html',
  styleUrl: './configuration-view.css',
})
export class ConfigurationView {
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly store = inject(ConfigurationStore);
  protected readonly iam = inject(IamStore);

  protected readonly subColumns = ['id', 'summary'] as const;
  protected readonly iotColumns = [
    'nodeIdentifier',
    'connectionStatus',
    'batteryVoltage',
    'lastSeen',
    'firmwareVersion',
    'linkedMachine',
    'linkAction',
  ] as const;

  /** Borrador de máquina por id de nodo (solo UI hasta Guardar / PUT). */
  protected readonly linkSelections = signal<Record<number, number>>({});
  protected readonly savingNodeId = signal<number | null>(null);

  constructor() {
    this.store.loadApiSnapshot();
  }

  protected refreshApi(): void {
    this.linkSelections.set({});
    this.store.loadApiSnapshot();
  }

  protected openAddIotNode(): void {
    this.dialog.open(AddIotNodeDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  protected openAddMaintenance(): void {
    this.dialog.open(AddMaintenanceDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  protected effectiveMachineryId(node: IotNodeApiDto): number {
    const draft = this.linkSelections()[node.id];
    return draft ?? node.machineryId;
  }

  protected onMachineryDraftChange(nodeId: number, machineryId: number): void {
    this.linkSelections.update((m) => ({ ...m, [nodeId]: machineryId }));
  }

  protected machineryLabel(machineryId: number): string {
    const m = this.store.machinery().find((x) => x.id === machineryId);
    if (!m) {
      return this.translate.instant('configuration.iot.unlinkedMachine');
    }
    return `${m.plateNumber} · ${m.brand} ${m.model}`;
  }

  protected isLinkDirty(node: IotNodeApiDto): boolean {
    return this.effectiveMachineryId(node) !== node.machineryId;
  }

  protected saveNodeLink(node: IotNodeApiDto): void {
    if (!this.store.httpPutDeleteEnabled() || !this.isLinkDirty(node)) {
      return;
    }
    const machineryId = this.effectiveMachineryId(node);
    this.savingNodeId.set(node.id);
    this.store
      .linkIotNodeToMachinery(node.id, machineryId)
      .pipe(
        take(1),
        finalize(() => this.savingNodeId.set(null)),
      )
      .subscribe({
        next: () => {
          this.linkSelections.update((m) => {
            const { [node.id]: _removed, ...rest } = m;
            return rest;
          });
          this.snack.open(this.translate.instant('configuration.iot.linkSuccess'), undefined, { duration: 2800 });
        },
        error: () => {
          this.snack.open(this.translate.instant('configuration.iot.linkError'), undefined, { duration: 4200 });
        },
      });
  }

  protected connectionStatusLabel(status: string): string {
    const k = String(status).toLowerCase();
    if (k === 'online' || k === 'offline') {
      return this.translate.instant(`configuration.iot.status.${k}`);
    }
    return status;
  }

  /** Estilo del chip de estado (online / offline / otro). */
  protected statusTone(status: string): 'on' | 'off' | 'other' {
    const k = String(status).toLowerCase();
    if (k === 'online') {
      return 'on';
    }
    if (k === 'offline') {
      return 'off';
    }
    return 'other';
  }
}
