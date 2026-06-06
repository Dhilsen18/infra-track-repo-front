import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, take } from 'rxjs';

import { AlertsCenterStore } from '../../../application/alerts-center.store';
import { AlertApiDto } from '../../../../shared/infrastructure/infratrack-api.contracts';

@Component({
  selector: 'app-add-alert-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './add-alert-dialog.html',
  styleUrl: './add-alert-dialog.css',
})
export class AddAlertDialog {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AlertsCenterStore);
  private readonly dialogRef = inject(MatDialogRef<AddAlertDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    machineryId: [1, [Validators.required, Validators.min(1)]],
    type: ['fuel_theft' as AlertApiDto['type'], Validators.required],
    severity: ['warning' as 'critical' | 'warning', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: Omit<AlertApiDto, 'id'> = {
      machineryId: v.machineryId,
      type: v.type,
      severity: v.severity,
      description: v.description.trim(),
      isAcknowledged: false,
      timestamp: new Date().toISOString(),
    };
    this.saving.set(true);
    this.store
      .createAlert(payload)
      .pipe(
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open(this.translate.instant('reports.alertsCenter.createSuccess'), undefined, { duration: 2800 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('reports.alertsCenter.createError'), undefined, { duration: 4200 });
        },
      });
  }
}
