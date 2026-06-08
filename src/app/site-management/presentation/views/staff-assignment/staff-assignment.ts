import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatSelect, MatOption } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { OnboardingDraftStore } from '../../../../iam/application/onboarding-draft.store';
import { PageHeaderCard } from '../../../../shared/presentation/components/page-header-card/page-header-card';
import { SiteManagementStore } from '../../../application/site-management.store';

@Component({
  selector: 'app-staff-assignment',
  imports: [RouterLink, MatCheckbox, MatFormField, MatLabel, MatSelect, MatOption, TranslatePipe, PageHeaderCard],
  templateUrl: './staff-assignment.html',
  styleUrl: './staff-assignment.css',
})
export class StaffAssignment implements OnInit {
  protected readonly store = inject(SiteManagementStore);
  private readonly onboarding = inject(OnboardingDraftStore);

  protected readonly companyCode = computed(
    () => this.onboarding.companyCode() ?? '—',
  );

  protected readonly activeStaff = computed(() =>
    this.store.staff().filter((member) => member.status === 'active'),
  );

  ngOnInit(): void {
    this.store.loadCatalog();
  }

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
