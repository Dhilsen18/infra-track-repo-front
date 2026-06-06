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
import { buildCreateMaintenanceBody } from '../../../infrastructure/configuration-forms.mapper';
import { INFRATRACK_API } from '../../../../shared/infrastructure/infratrack-api.urls';
import {
  MachineryApiDto,
  MaintenanceServiceType,
} from '../../../../shared/infrastructure/infratrack-api.contracts';

@Component({
  selector: 'app-add-maintenance-dialog',
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
  templateUrl: './add-maintenance-dialog.html',
  styleUrl: './add-maintenance-dialog.css',
})
export class AddMaintenanceDialog {
  private static ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private static addDays(base: Date, days: number): Date {
    const out = new Date(base);
    out.setDate(out.getDate() + days);
    return out;
  }

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly store = inject(ConfigurationStore);
  private readonly dialogRef = inject(MatDialogRef<AddMaintenanceDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly saving = signal(false);
  protected readonly machineryList = signal<MachineryApiDto[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    machineryId: [0, [Validators.required, Validators.min(1)]],
    serviceType: ['general' as MaintenanceServiceType, Validators.required],
    description: ['', [Validators.required, Validators.maxLength(512)]],
    costPen: [0, [Validators.required, Validators.min(0)]],
    engineHoursAtService: [0, [Validators.required, Validators.min(0)]],
    serviceDate: [AddMaintenanceDialog.ymd(new Date()), Validators.required],
    nextServiceDate: [AddMaintenanceDialog.ymd(AddMaintenanceDialog.addDays(new Date(), 30)), Validators.required],
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
    const body = buildCreateMaintenanceBody({
      machineryId: v.machineryId,
      serviceType: v.serviceType,
      description: v.description.trim(),
      costPen: v.costPen,
      engineHoursAtService: v.engineHoursAtService,
      serviceDate: v.serviceDate,
      nextServiceDate: v.nextServiceDate,
    });
    this.saving.set(true);
    this.store
      .addMaintenanceRecord(body)
      .pipe(
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open(this.translate.instant('configuration.addMaint.success'), undefined, { duration: 3200 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('configuration.addMaint.error'), undefined, { duration: 4500 });
        },
      });
  }
}
