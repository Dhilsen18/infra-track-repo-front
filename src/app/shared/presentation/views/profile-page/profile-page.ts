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

const STATIC_OWNER: Omit<ProfileViewData, 'id' | 'roleKey'> = {
  name: 'Ing. Patricia Rojas',
  email: 'patricia.rojas@infratrack.demo',
  createdAt: '2025-08-15T10:00:00.000Z',
  isActive: true,
  phone: '+51 999 200 100',
  licenseNumber: '—',
  operatorStatusKey: 'profile.operatorStatus.active',
  companyName: 'Constructora InfraTrack S.A.C.',
  assignedWorksite: '—',
  companyCode: 'INFRA-CONSTRUCTORA-2026',
  jobTitleKey: 'profile.role.owner',
};

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
    const userId = this.resolveUserId();
    this.userData.set(this.buildStaticProfile(userId));
    if (this.iam.isOwner()) {
      this.currentPlan.set(this.buildStaticPlan());
    }
  }

  protected goToPlans(): void {
    void this.router.navigate(['/subscription-plans']);
  }

  private buildStaticProfile(userId: number): ProfileViewData {
    const session = this.iam.sessionData();
    const role = session?.role ?? 'admin';

    if (role === 'owner') {
      const draft = this.onboarding.ownerDraft();
      if (draft) {
        return {
          id: session?.userId ?? userId,
          name: draft.fullName,
          email: draft.email,
          roleKey: 'profile.role.owner',
          createdAt: STATIC_OWNER.createdAt,
          isActive: true,
          phone: STATIC_OWNER.phone,
          licenseNumber: '—',
          operatorStatusKey: 'profile.operatorStatus.active',
          companyName: draft.companyLegalName,
          assignedWorksite: '—',
          companyCode: this.onboarding.companyCode() ?? STATIC_OWNER.companyCode,
          jobTitleKey: 'profile.role.owner',
        };
      }
      return {
        id: session?.userId ?? userId,
        roleKey: 'profile.role.owner',
        ...STATIC_OWNER,
      };
    }

    const opsDraft = this.onboarding.readOpsDraft();
    const driver = this.fleet.drivers().find((d) => d.id === userId) ?? this.fleet.drivers()[0];

    return {
      id: session?.userId ?? userId,
      name: opsDraft?.fullName ?? driver?.fullName ?? session?.username ?? 'Carlos Vizcarra',
      email: opsDraft?.email ?? driver?.email ?? 'carlos.vizcarra@infratrack.demo',
      roleKey: 'profile.role.admin',
      createdAt: '2025-03-10T08:00:00.000Z',
      isActive: true,
      phone: driver?.phone ?? '+51 999 111 222',
      licenseNumber: driver?.licenseNumber ?? 'Q1-2045',
      operatorStatusKey:
        driver?.status === 'inactive'
          ? 'profile.operatorStatus.inactive'
          : 'profile.operatorStatus.active',
      companyName: '—',
      assignedWorksite: driver?.assignedWorksite ?? this.fleet.worksiteLabel,
      companyCode: opsDraft?.companyCode ?? 'INFRA-OP-2026',
      jobTitleKey: 'profile.role.admin',
    };
  }

  private buildStaticPlan(): ProfilePlanView {
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
