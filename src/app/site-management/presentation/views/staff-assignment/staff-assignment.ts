import { Component, inject } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatSelect, MatOption } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { SiteManagementStore } from '../../../application/site-management.store';

@Component({
  selector: 'app-staff-assignment',
  imports: [MatCheckbox, MatFormField, MatLabel, MatSelect, MatOption, TranslatePipe, PageHeaderCard],
  templateUrl: './staff-assignment.html',
  styleUrl: './staff-assignment.css',
})
export class StaffAssignment {
  protected readonly store = inject(SiteManagementStore);

  isSelected(staffId: number): boolean {
    return this.store.assignmentStaffIds().includes(staffId);
  }

  toggle(staffId: number): void {
    this.store.toggleAssignmentStaff(staffId);
  }

  onWorksiteChange(value: number | null): void {
    this.store.setAssignmentWorksite(value);
  }

  confirm(): void {
    this.store.confirmAssignment();
  }
}
