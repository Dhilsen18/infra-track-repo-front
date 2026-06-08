import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PageHeaderCard } from '../../components/page-header-card/page-header-card';
import { IamStore } from '../../../../iam/application/iam.store';
import { OnboardingDraftStore, SubscriptionPlanId } from '../../../../iam/application/onboarding-draft.store';
import { FleetStore } from '../../../../fleet/application/fleet.store';

export interface ProfileViewData {
  id: number;
  name: string;
  email: string;
  roleKey: string;
  createdAt: string;
  isActive: boolean;
  phone: string;
  licenseNumber: string;
  operatorStatusKey: string;
  companyName: string;
  assignedWorksite: string;
  companyCode: string;
  jobTitleKey: string;
}

export interface ProfilePlanView {
  planId: SubscriptionPlanId;
  nameKey: string;
  priceKey: string;
  statusKey: string;
  autoRenew: boolean;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, RouterLink, PageHeaderCard],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage implements OnInit {
  private readonly router = inject(Router);

  protected readonly iam = inject(IamStore);
  private readonly onboarding = inject(OnboardingDraftStore);
  private readonly fleet = inject(FleetStore);

  readonly userData = signal<ProfileViewData | null>(null);
  readonly currentPlan = signal<ProfilePlanView | null>(null);

  readonly userInitial = computed(() => {
    const name = this.userData()?.name ?? this.iam.username() ?? '?';
    return name.charAt(0).toUpperCase();
  });

  ngOnInit(): void {
    if (this.iam.isAdmin() && !this.fleet.drivers().length) {
      this.fleet.loadFleet();
    }
    const userId = this.resolveUserId();
    this.userData.set(this.buildProfile(userId));
    if (this.iam.isOwner()) {
      this.currentPlan.set(this.buildPlan());
    }
  }

  protected goToPlans(): void {
    void this.router.navigate(['/subscription-plans']);
  }

  private buildProfile(userId: number): ProfileViewData {
    const session = this.iam.sessionData();
    const role = session?.role ?? 'admin';
    const username = session?.username ?? 'usuario@infratrack.local';

    if (role === 'owner') {
      const draft = this.onboarding.ownerDraft();
      return {
        id: session?.userId ?? userId,
        name: draft?.fullName ?? username.split('@')[0],
        email: draft?.email ?? username,
        roleKey: 'profile.role.owner',
        createdAt: session?.loggedInAt ? new Date(session.loggedInAt).toISOString() : new Date().toISOString(),
        isActive: true,
        phone: '—',
        licenseNumber: '—',
        operatorStatusKey: 'profile.operatorStatus.active',
        companyName: draft?.companyLegalName ?? '—',
        assignedWorksite: '—',
        companyCode: this.onboarding.companyCode() ?? '—',
        jobTitleKey: 'profile.role.owner',
      };
    }

    const opsDraft = this.onboarding.readOpsDraft();
    const operator =
      this.fleet.drivers().find((d) => d.id === userId) ??
      this.fleet.drivers().find((d) => d.email === username) ??
      this.fleet.drivers()[0];

    return {
      id: session?.userId ?? userId,
      name: opsDraft?.fullName ?? operator?.fullName ?? username.split('@')[0],
      email: opsDraft?.email ?? username,
      roleKey: 'profile.role.admin',
      createdAt: session?.loggedInAt ? new Date(session.loggedInAt).toISOString() : new Date().toISOString(),
      isActive: true,
      phone: operator?.phone ?? '—',
      licenseNumber: operator?.licenseNumber ?? '—',
      operatorStatusKey:
        operator?.status === 'inactive'
          ? 'profile.operatorStatus.inactive'
          : 'profile.operatorStatus.active',
      companyName: '—',
      assignedWorksite: operator?.assignedWorksite ?? '—',
      companyCode: opsDraft?.companyCode ?? '—',
      jobTitleKey: 'profile.role.admin',
    };
  }

  private buildPlan(): ProfilePlanView {
    const planId = this.onboarding.selectedPlan() ?? 'premium';
    const map: Record<SubscriptionPlanId, { nameKey: string; priceKey: string }> = {
      basic: { nameKey: 'signup.planBasicName', priceKey: 'signup.planBasicPrice' },
      premium: { nameKey: 'signup.planPremiumName', priceKey: 'signup.planPremiumPrice' },
      enterprise: { nameKey: 'signup.planEnterpriseName', priceKey: 'signup.planEnterprisePrice' },
    };
    const meta = map[planId];
    return {
      planId,
      nameKey: meta.nameKey,
      priceKey: meta.priceKey,
      statusKey: 'profile.subscription.statusActive',
      autoRenew: this.onboarding.autoRenew(),
    };
  }

  private resolveUserId(): number {
    const fromSession = this.iam.sessionData()?.userId;
    if (fromSession != null && Number.isFinite(fromSession)) {
      return fromSession;
    }
    return 1;
  }
}
