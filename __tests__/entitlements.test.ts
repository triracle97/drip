import {
  annualPerMonth,
  annualSavingsPct,
  cleanPrice,
  daysUntil,
  freeTrialDays,
  isoPeriodToDays,
  pickPlans,
  resolveAccess,
} from '@/lib/entitlements';

const entitlement = (over: Record<string, any> = {}) => ({
  identifier: 'pro',
  isActive: true,
  willRenew: true,
  periodType: 'NORMAL',
  productIdentifier: 'drip_pro_yearly',
  expirationDate: '2027-11-22T10:00:00Z',
  ...over,
});

const info = (over: Record<string, any> = {}): any => ({
  entitlements: { active: {}, all: {} },
  nonSubscriptionTransactions: [],
  allPurchasedProductIdentifiers: [],
  activeSubscriptions: [],
  originalAppUserId: '$RCAnonymousID:abc',
  ...over,
});

describe('resolveAccess', () => {
  it('no info → no access', () => {
    expect(resolveAccess(null).hasAccess).toBe(false);
    expect(resolveAccess(undefined).kind).toBe('none');
  });

  it('active subscription', () => {
    const a = resolveAccess(info({ entitlements: { active: { pro: entitlement() }, all: {} } }));
    expect(a).toMatchObject({ hasAccess: true, kind: 'subscription', willRenew: true, productId: 'drip_pro_yearly' });
  });

  it('store free trial', () => {
    const a = resolveAccess(info({ entitlements: { active: { pro: entitlement({ periodType: 'TRIAL' }) }, all: {} } }));
    expect(a).toMatchObject({ hasAccess: true, kind: 'trial' });
  });

  it('non-expiring entitlement = lifetime', () => {
    const a = resolveAccess(info({ entitlements: { active: { pro: entitlement({ expirationDate: null, productIdentifier: 'drip_pro_lifetime' }) }, all: {} } }));
    expect(a).toMatchObject({ hasAccess: true, kind: 'lifetime', expiresAt: null });
  });

  it('legacy one-time buyers get access through the pro entitlement (com.triracle.drippro)', () => {
    const a = resolveAccess(info({
      entitlements: { active: { pro: entitlement({ expirationDate: null, willRenew: false, productIdentifier: 'com.triracle.drippro' }) }, all: {} },
      nonSubscriptionTransactions: [{ productIdentifier: 'com.triracle.drippro' }],
    }));
    expect(a).toMatchObject({ hasAccess: true, kind: 'lifetime', productId: 'com.triracle.drippro' });
  });

  it('purchase history alone never unlocks — only the pro entitlement does', () => {
    const a = resolveAccess(info({
      nonSubscriptionTransactions: [{ productIdentifier: 'com.triracle.drippro' }],
      allPurchasedProductIdentifiers: ['com.triracle.drippro', 'drip_pro_yearly'],
      activeSubscriptions: ['drip_pro_yearly'],
    }));
    expect(a.hasAccess).toBe(false);
  });

  it('ignores other entitlements (old "Drip Pro" entitlement)', () => {
    const a = resolveAccess(info({ entitlements: { active: { 'Drip Pro': entitlement() }, all: {} } }));
    expect(a.hasAccess).toBe(false);
  });

  it('expired subscription does NOT grant access (regression)', () => {
    const a = resolveAccess(info({
      entitlements: { active: {}, all: { pro: entitlement({ isActive: false, expirationDate: '2026-01-01T00:00:00Z' }) } },
      allPurchasedProductIdentifiers: ['drip_pro_monthly'],
    }));
    expect(a.hasAccess).toBe(false);
  });

  it('cancelled-but-not-yet-expired subscription keeps access, willRenew false', () => {
    const a = resolveAccess(info({ entitlements: { active: { pro: entitlement({ willRenew: false }) }, all: {} } }));
    expect(a).toMatchObject({ hasAccess: true, willRenew: false });
  });
});

const pkg = (identifier: string, packageType: string, product: Record<string, any>): any => ({
  identifier,
  packageType,
  product: { identifier: `${identifier}_product`, price: 0, priceString: '', subscriptionPeriod: null, introPrice: null, ...product },
});

describe('plans', () => {
  const monthly = pkg('$rc_monthly', 'MONTHLY', { price: 5, priceString: '$5.00', subscriptionPeriod: 'P1M' });
  const annual = pkg('$rc_annual', 'ANNUAL', { price: 30, priceString: '$30.00', subscriptionPeriod: 'P1Y', pricePerMonthString: '$2.50' });

  it('picks by offering shortcuts, package type, identifier or period', () => {
    expect(pickPlans({ monthly, annual, availablePackages: [monthly, annual] } as any)).toEqual({ monthly, annual });
    expect(pickPlans({ availablePackages: [annual, monthly] } as any)).toEqual({ monthly, annual });
    const m2 = pkg('custom_m', 'CUSTOM', { subscriptionPeriod: 'P1M' });
    expect(pickPlans({ availablePackages: [m2] } as any)).toEqual({ monthly: m2, annual: null });
    expect(pickPlans(null)).toEqual({ monthly: null, annual: null });
  });

  it('yearly savings vs monthly ($30 vs $60 = 50%)', () => {
    expect(annualSavingsPct({ monthly, annual })).toBe(50);
    expect(annualSavingsPct({ monthly: null, annual })).toBe(0);
    expect(annualPerMonth({ monthly, annual })).toBe('$2.50');
  });

  it('free trial length from iOS intro price', () => {
    expect(freeTrialDays({ introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, period: 'P3D', cycles: 1, priceString: '$0' } } as any)).toBe(3);
    expect(freeTrialDays({ introPrice: { price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1, period: 'P1W', cycles: 1, priceString: '$0' } } as any)).toBe(7);
  });

  it('free trial length from Google Play free phase', () => {
    expect(freeTrialDays({ introPrice: null, defaultOption: { freePhase: { billingPeriod: { iso8601: 'P3D' } } } } as any)).toBe(3);
  });

  it('paid intro offer or none → no free trial', () => {
    expect(freeTrialDays({ introPrice: { price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1, period: 'P1M', cycles: 1, priceString: '$0.99' } } as any)).toBeNull();
    expect(freeTrialDays({ introPrice: null } as any)).toBeNull();
    expect(freeTrialDays(null)).toBeNull();
  });

  it('helpers', () => {
    expect(isoPeriodToDays('P3D')).toBe(3);
    expect(isoPeriodToDays('P2W')).toBe(14);
    expect(isoPeriodToDays('bad')).toBeNull();
    expect(cleanPrice('US$4.99')).toBe('$4.99');
    expect(cleanPrice('4,99 €')).toBe('4,99 €');
    expect(daysUntil('2026-11-25T10:00:00Z', Date.parse('2026-11-22T10:00:00Z'))).toBe(3);
    expect(daysUntil(null)).toBe(0);
  });
});
