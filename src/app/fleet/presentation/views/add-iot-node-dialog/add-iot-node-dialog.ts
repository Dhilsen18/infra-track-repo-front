import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of, take } from 'rxjs';

import { ConfigurationStore } from '../../../application/configuration.store';
import { buildCreateIotNodeBody } from '../../../infrastructure/configuration-forms.mapper';
import { INFRATRACK_API } from '../../../../shared/infrastructure/infratrack-api.urls';
import { MachineryApiDto } from '../../../../shared/infrastructure/infratrack-api.contracts';

@Component({
  selector: 'app-add-iot-node-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './add-iot-node-dialog.html',
  styleUrl: './add-iot-node-dialog.css',
})
export class AddIotNodeDialog {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly store = inject(ConfigurationStore);
  private readonly dialogRef = inject(MatDialogRef<AddIotNodeDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly saving = signal(false);
  protected readonly machineryList = signal<MachineryApiDto[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    machineryId: [0, [Validators.required, Validators.min(1)]],
    nodeIdentifier: ['', [Validators.required, Validators.maxLength(64)]],
    firmwareVersion: ['', [Validators.required, Validators.maxLength(32)]],
    batteryVoltage: [12.6, [Validators.required, Validators.min(0), Validators.max(999)]],
    connectionStatus: ['online' as 'online' | 'offline', Validators.required],
    lastSeen: [new Date().toISOString(), [Validators.required, Validators.maxLength(64)]],
  });

  constructor() {
    this.http
      .get<MachineryApiDto[]>(INFRATRACK_API.machinery)
      .pipe(take(1), catchError(() => of([])))
      .subscribe((list) => {
        this.machineryList.set(list);
        if (list.length) {
          this.form.patchValue({ machineryId: list[0].id });
        }
      });
  }

  submit(): void {
    if (this.form.invalid || this.saving() || !this.machineryList().length) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = buildCreateIotNodeBody({
      machineryId: v.machineryId,
      nodeIdentifier: v.nodeIdentifier.trim(),
      firmwareVersion: v.firmwareVersion.trim(),
      batteryVoltage: v.batteryVoltage,
      connectionStatus: v.connectionStatus,
      lastSeen: v.lastSeen.trim(),
    });
    this.saving.set(true);
    this.store
      .addIotNode(body)
      .pipe(
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open(this.translate.instant('configuration.addIot.success'), undefined, { duration: 3200 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('configuration.addIot.error'), undefined, { duration: 4500 });
        },
      });
  }
}
