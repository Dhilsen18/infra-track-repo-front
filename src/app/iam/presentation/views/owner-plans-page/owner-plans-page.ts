import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import {
  OnboardingDraftStore,
  SubscriptionPlanId,
} from '../../../application/onboarding-draft.store';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

interface PlanOption {
  id: SubscriptionPlanId;
  nameKey: string;
  priceKey: string;
  taglineKey: string;
  featureKeys: string[];
  featured?: boolean;
  enterprise?: boolean;
}

@Component({
  selector: 'app-owner-plans-page',
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './owner-plans-page.html',
  styleUrl: './owner-plans-page.css',
})
export class OwnerPlansPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly drafts = inject(OnboardingDraftStore);
  protected readonly iam = inject(IamStore);

  protected readonly isProfileContext = computed(
    () => this.route.snapshot.data['plansContext'] === 'profile',
  );

  protected readonly displayCompanyName = computed(() => {
    const draft = this.drafts.ownerDraft();
    if (draft?.companyLegalName) {
      return draft.companyLegalName;
    }
    return 'Constructora InfraTrack S.A.C.';
  });

  protected readonly plans: PlanOption[] = [
    {
      id: 'basic',
      nameKey: 'signup.planBasicName',
      priceKey: 'signup.planBasicPrice',
      taglineKey: 'signup.planBasicTagline',
      featureKeys: [
        'signup.planBasicFeature1',
        'signup.planBasicFeature2',
        'signup.planBasicFeature3',
        'signup.planBasicFeature4',
        'signup.planBasicFeature5',
        'signup.planBasicFeature6',
      ],
    },
    {
      id: 'premium',
      nameKey: 'signup.planPremiumName',
      priceKey: 'signup.planPremiumPrice',
      taglineKey: 'signup.planPremiumTagline',
      featureKeys: [
        'signup.planPremiumFeature1',
        'signup.planPremiumFeature2',
        'signup.planPremiumFeature3',
        'signup.planPremiumFeature4',
        'signup.planPremiumFeature5',
        'signup.planPremiumFeature6',
      ],
      featured: true,
    },
    {
      id: 'enterprise',
      nameKey: 'signup.planEnterpriseName',
      priceKey: 'signup.planEnterprisePrice',
      taglineKey: 'signup.planEnterpriseTagline',
      featureKeys: [
        'signup.planEnterpriseFeature1',
        'signup.planEnterpriseFeature2',
        'signup.planEnterpriseFeature3',
        'signup.planEnterpriseFeature4',
        'signup.planEnterpriseFeature5',
        'signup.planEnterpriseFeature6',
      ],
      enterprise: true,
    },
  ];

  protected readonly selectedPlan = signal<SubscriptionPlanId | null>(null);
  protected readonly authError = signal<string | null>(null);
  protected readonly companyCode = signal<string | null>(null);
  protected readonly step = signal<'select' | 'success'>('select');

  protected readonly ownerDraft = computed(() => this.drafts.ownerDraft());

  back(): void {
    if (this.step() === 'success') {
      this.step.set('select');
      this.companyCode.set(null);
      return;
    }
    if (this.isProfileContext()) {
      void this.router.navigate(['/profile']);
      return;
    }
    void this.router.navigate(['/iam/owner/signup']);
  }

  choosePlan(planId: SubscriptionPlanId): void {
    if (!this.isProfileContext()) {
      const draft = this.ownerDraft();
      if (!draft) {
        void this.router.navigate(['/iam/owner/signup']);
        return;
      }
    }

    this.selectedPlan.set(planId);
    this.drafts.setSelectedPlan(planId);

    const companyName = this.displayCompanyName();
    const code =
      this.drafts.companyCode() ?? this.drafts.generateAndSaveCompanyCode(companyName);
    this.companyCode.set(code);
    this.step.set('success');
  }

  enterDashboard(): void {
    if (this.isProfileContext()) {
      void this.router.navigateByUrl('/control-panel');
      return;
    }

    const draft = this.ownerDraft();
    if (!draft) {
      void this.router.navigate(['/iam/owner/signup']);
      return;
    }
    this.authError.set(null);
    this.iam
      .signUpThenSignIn(draft.email, draft.password, ['ROLE_OWNER'], this.router, {
        expectedRole: 'owner',
      })
      .subscribe((ok) => {
        if (!ok) {
          this.authError.set('signup.errorAuth');
        }
      });
  }
}
