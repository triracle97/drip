/**
 * Pure access / pricing logic for the Drip Pro paywall.
 *
 * Model: hard paywall. Access is decided ONLY by the RevenueCat entitlement
 * `pro` being active. Everything that unlocks the app is attached to it in the
 * dashboard:
 *   - drip_pro_monthly / drip_pro_yearly (iOS), drip_pro:monthly / drip_pro:yearly
 *     (Android), incl. the store-managed 3-day free trial;
 *   - the legacy one-time product com.triracle.drippro (old buyers keep access).
 * Never gate on product IDs, purchase history or any other entitlement
 * (an old "Drip Pro" entitlement still exists in the dashboard — unused).
 *
 * Everything here is free of React / native modules so it can be unit tested.
 */
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';

export const ENTITLEMENT_ID = 'pro';

export type AccessKind = 'lifetime' | 'subscription' | 'trial' | 'none';

export interface AccessState {
  hasAccess: boolean;
  kind: AccessKind;
  /** ISO date the current period ends (null for lifetime / none). */
  expiresAt: string | null;
  willRenew: boolean;
  productId: string | null;
}

export const NO_ACCESS: AccessState = {
  hasAccess: false,
  kind: 'none',
  expiresAt: null,
  willRenew: false,
  productId: null,
};

export function resolveAccess(info: CustomerInfo | null | undefined): AccessState {
  if (!info) return NO_ACCESS;

  const ent = info.entitlements?.active?.[ENTITLEMENT_ID];
  if (ent && ent.isActive !== false) {
    if (!ent.expirationDate) {
      return {
        hasAccess: true,
        kind: 'lifetime',
        expiresAt: null,
        willRenew: false,
        productId: ent.productIdentifier ?? null,
      };
    }
    return {
      hasAccess: true,
      kind: ent.periodType === 'TRIAL' ? 'trial' : 'subscription',
      expiresAt: ent.expirationDate,
      willRenew: !!ent.willRenew,
      productId: ent.productIdentifier ?? null,
    };
  }

  return NO_ACCESS;
}

// ─── Plans ──────────────────────────────────────────────

export interface Plans {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
}

function periodOf(p: PurchasesPackage): string | null {
  return p.product?.subscriptionPeriod ?? null;
}

export function pickPlans(offering: PurchasesOffering | null | undefined): Plans {
  const pkgs = offering?.availablePackages ?? [];
  const find = (type: 'MONTHLY' | 'ANNUAL', id: string, period: string) =>
    pkgs.find((p) => p.packageType === type) ??
    pkgs.find((p) => p.identifier === id) ??
    pkgs.find((p) => periodOf(p) === period) ??
    null;
  return {
    monthly: offering?.monthly ?? find('MONTHLY', '$rc_monthly', 'P1M'),
    annual: offering?.annual ?? find('ANNUAL', '$rc_annual', 'P1Y'),
  };
}

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Parse ISO-8601 periods like P3D, P1W, P1M. Returns days or null. */
export function isoPeriodToDays(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^P(\d+)([DWMY])$/.exec(iso);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n * ({ D: 1, W: 7, M: 30, Y: 365 } as const)[m[2] as 'D' | 'W' | 'M' | 'Y'];
}

/** Length of the free trial attached to a product, in days (null = none). */
export function freeTrialDays(product: PurchasesStoreProduct | null | undefined): number | null {
  if (!product) return null;
  const intro = product.introPrice;
  if (intro && intro.price === 0) {
    const unit = UNIT_DAYS[intro.periodUnit] ?? null;
    if (unit && intro.periodNumberOfUnits > 0) return unit * intro.periodNumberOfUnits;
    const d = isoPeriodToDays(intro.period);
    if (d) return d;
  }
  // Google Play: free phase of the default subscription option.
  const free = product.defaultOption?.freePhase;
  if (free) return isoPeriodToDays(free.billingPeriod?.iso8601) ?? null;
  return null;
}

/** % saved by the annual plan vs paying monthly for 12 months (0 if none). */
export function annualSavingsPct(plans: Plans): number {
  const mo = plans.monthly?.product.price;
  const yr = plans.annual?.product.price;
  if (!mo || !yr || mo <= 0) return 0;
  const pct = Math.round((1 - yr / (mo * 12)) * 100);
  return pct > 0 ? pct : 0;
}

/** Monthly-equivalent price string for the annual plan, e.g. "$1.25". */
export function annualPerMonth(plans: Plans): string | null {
  const p = plans.annual?.product;
  if (!p) return null;
  if (p.pricePerMonthString) return p.pricePerMonthString;
  return null;
}

/** Store price strings sometimes read "US$4.99"; the paywall shows "$4.99". */
export function cleanPrice(s: string | null | undefined): string {
  return (s ?? '').replace(/^US\$/, '$');
}

/** Days (rounded up) until an ISO date; 0 if past/invalid. */
export function daysUntil(iso: string | null | undefined, now: number = Date.now()): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - now) / 86400000));
}
