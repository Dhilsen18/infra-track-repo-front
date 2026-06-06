export type SubscriptionPlanTier = 'basic' | 'premium' | 'enterprise';

export interface PlanCatalogEntry {
  tier: SubscriptionPlanTier;
  maxMachinery: number;
  pricePen: number;
  maxWorksites: number;
  maxTransports: number;
  maxIotDevices: number;
  drivers: boolean;
  advancedReports: boolean;
}

/** Sentinel for unlimited quotas (Enterprise). */
export const PLAN_UNLIMITED = 999_999;

export const PLAN_CATALOG: Record<SubscriptionPlanTier, PlanCatalogEntry> = {
  basic: {
    tier: 'basic',
    maxMachinery: 10,
    pricePen: 149,
    maxWorksites: 5,
    maxTransports: 10,
    maxIotDevices: 10,
    drivers: false,
    advancedReports: false,
  },
  premium: {
    tier: 'premium',
    maxMachinery: 100,
    pricePen: 399,
    maxWorksites: 40,
    maxTransports: 100,
    maxIotDevices: 100,
    drivers: true,
    advancedReports: true,
  },
  enterprise: {
    tier: 'enterprise',
    maxMachinery: PLAN_UNLIMITED,
    pricePen: 1299,
    maxWorksites: PLAN_UNLIMITED,
    maxTransports: PLAN_UNLIMITED,
    maxIotDevices: PLAN_UNLIMITED,
    drivers: true,
    advancedReports: true,
  },
};

export function isUnlimitedQuota(value: number): boolean {
  return value >= PLAN_UNLIMITED;
}

export function coercePlanTier(raw: string | undefined | null): SubscriptionPlanTier {
  const n = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (n.includes('enterprise')) {
    return 'enterprise';
  }
  if (n.includes('premium')) {
    return 'premium';
  }
  if (n.includes('basic')) {
    return 'basic';
  }
  return 'basic';
}
