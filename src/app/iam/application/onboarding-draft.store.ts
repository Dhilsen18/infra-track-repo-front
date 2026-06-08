import { Injectable, signal } from '@angular/core';

export interface OwnerSignupDraft {
  fullName: string;
  email: string;
  password: string;
  companyLegalName: string;
}

export interface OpsSignupDraft {
  fullName: string;
  email: string;
  password: string;
  companyCode: string;
}

export type SubscriptionPlanId = 'basic' | 'premium' | 'enterprise';

const OWNER_DRAFT_KEY = 'infratrack_owner_signup_draft';
const OPS_DRAFT_KEY = 'infratrack_ops_signup_draft';
const COMPANY_CODE_KEY = 'infratrack_company_code';
const SELECTED_PLAN_KEY = 'infratrack_selected_plan';
const AUTO_RENEW_KEY = 'infratrack_subscription_auto_renew';

/**
 * In-memory onboarding drafts until the backend IAM API is available.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingDraftStore {
  private readonly ownerDraftSignal = signal<OwnerSignupDraft | null>(this.readOwnerDraft());
  private readonly selectedPlanSignal = signal<SubscriptionPlanId | null>(this.readSelectedPlan());
  private readonly companyCodeSignal = signal<string | null>(this.readCompanyCode());
  private readonly autoRenewSignal = signal<boolean>(this.readAutoRenew());

  readonly ownerDraft = this.ownerDraftSignal.asReadonly();
  readonly selectedPlan = this.selectedPlanSignal.asReadonly();
  readonly companyCode = this.companyCodeSignal.asReadonly();
  readonly autoRenew = this.autoRenewSignal.asReadonly();

  saveOwnerDraft(draft: OwnerSignupDraft): void {
    sessionStorage.setItem(OWNER_DRAFT_KEY, JSON.stringify(draft));
    this.ownerDraftSignal.set(draft);
  }

  saveOpsDraft(draft: OpsSignupDraft): void {
    sessionStorage.setItem(OPS_DRAFT_KEY, JSON.stringify(draft));
  }

  readOpsDraft(): OpsSignupDraft | null {
    const raw = sessionStorage.getItem(OPS_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as OpsSignupDraft;
    } catch {
      return null;
    }
  }

  setSelectedPlan(plan: SubscriptionPlanId): void {
    sessionStorage.setItem(SELECTED_PLAN_KEY, plan);
    this.selectedPlanSignal.set(plan);
  }

  setAutoRenew(value: boolean): void {
    sessionStorage.setItem(AUTO_RENEW_KEY, JSON.stringify(value));
    this.autoRenewSignal.set(value);
  }

  generateAndSaveCompanyCode(companyLegalName: string): string {
    const existing = this.readCompanyCode();
    if (existing) {
      this.companyCodeSignal.set(existing);
      return existing;
    }

    const slug = companyLegalName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    const year = new Date().getFullYear();
    const code = `INFRA-${slug || 'EMPRESA'}-${year}-${this.randomCodeSuffix()}`;
    sessionStorage.setItem(COMPANY_CODE_KEY, code);
    this.companyCodeSignal.set(code);
    return code;
  }

  private randomCodeSuffix(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const random = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(random, (value) => chars[value % chars.length]).join('');
  }

  private readOwnerDraft(): OwnerSignupDraft | null {
    const raw = sessionStorage.getItem(OWNER_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as OwnerSignupDraft;
    } catch {
      return null;
    }
  }

  private readCompanyCode(): string | null {
    return sessionStorage.getItem(COMPANY_CODE_KEY);
  }

  private readSelectedPlan(): SubscriptionPlanId | null {
    const raw = sessionStorage.getItem(SELECTED_PLAN_KEY);
    if (raw === 'basic' || raw === 'premium' || raw === 'enterprise') {
      return raw;
    }
    return null;
  }

  private readAutoRenew(): boolean {
    const raw = sessionStorage.getItem(AUTO_RENEW_KEY);
    if (raw == null) {
      return true;
    }
    try {
      return JSON.parse(raw) === true;
    } catch {
      return true;
    }
  }
}
