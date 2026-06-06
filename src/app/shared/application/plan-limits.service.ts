import { computed, Injectable, inject } from '@angular/core';

import { OnboardingDraftStore, SubscriptionPlanId } from '../../iam/application/onboarding-draft.store';
import {
  isUnlimitedQuota,
  PLAN_CATALOG,
  type PlanCatalogEntry,
  type SubscriptionPlanTier,
} from '../infrastructure/subscription/plan-catalog';

@Injectable({ providedIn: 'root' })
export class PlanLimitsService {
  private readonly onboarding = inject(OnboardingDraftStore);

  readonly tier = computed<SubscriptionPlanTier>(() => this.onboarding.selectedPlan() ?? 'premium');
  readonly limits = computed<PlanCatalogEntry>(() => PLAN_CATALOG[this.tier()]);

  canAddWorksite(currentCount: number): boolean {
    const max = this.limits().maxWorksites;
    return isUnlimitedQuota(max) || currentCount < max;
  }

  canAddTransport(currentCount: number): boolean {
    const max = this.limits().maxTransports;
    return isUnlimitedQuota(max) || currentCount < max;
  }

  canAddIotDevice(currentCount: number): boolean {
    const max = this.limits().maxIotDevices;
    return isUnlimitedQuota(max) || currentCount < max;
  }

  displayMax(value: number): string {
    return isUnlimitedQuota(value) ? '∞' : String(value);
  }

  planNameKey(planId: SubscriptionPlanId = this.tier()): string {
    const keys: Record<SubscriptionPlanId, string> = {
      basic: 'subscriptionPlans.plan.basic.name',
      premium: 'subscriptionPlans.plan.premium.name',
      enterprise: 'subscriptionPlans.plan.enterprise.name',
    };
    return keys[planId];
  }
}
