import Purchases from 'react-native-purchases';

const P = Purchases as any;

const activeSub = (periodType = 'NORMAL') => ({
  entitlements: {
    active: { pro: { identifier: 'pro', isActive: true, willRenew: true, periodType, productIdentifier: 'drip_pro_yearly', expirationDate: '2099-01-01T00:00:00Z' } },
    all: {},
  },
  nonSubscriptionTransactions: [],
  allPurchasedProductIdentifiers: ['drip_pro_yearly'],
  originalAppUserId: 'u1',
});
const noAccess = () => ({
  entitlements: { active: {}, all: {} },
  nonSubscriptionTransactions: [],
  allPurchasedProductIdentifiers: ['drip_pro_monthly'], // expired sub
  originalAppUserId: 'u1',
});

const monthly = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'drip_pro_monthly', price: 2.99, priceString: '$2.99', subscriptionPeriod: 'P1M', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, period: 'P3D', cycles: 1, priceString: '$0' } } };
const annual = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'drip_pro_yearly', price: 14.99, priceString: '$14.99', subscriptionPeriod: 'P1Y', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, period: 'P3D', cycles: 1, priceString: '$0' } } };

const flush = () => new Promise((r) => setTimeout(r, 0));

function load() {
  let mod: typeof import('@/store/purchases');
  let settings: typeof import('@/store/settings');
  jest.isolateModules(() => {
    mod = require('@/store/purchases');
    settings = require('@/store/settings');
  });
  return { mod: mod!, settings: settings! };
}

beforeEach(() => {
  jest.clearAllMocks();
  P.__listeners.length = 0;
  process.env.EXPO_PUBLIC_RC_API_KEY = 'appl_test';
  P.getCustomerInfo.mockResolvedValue(noAccess());
  P.getOfferings.mockResolvedValue({ current: { identifier: 'default', availablePackages: [monthly, annual], monthly, annual }, all: {} });
  P.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({});
});

describe('initPurchases', () => {
  it('without an API key: ready, no access, no crash', async () => {
    delete process.env.EXPO_PUBLIC_RC_API_KEY;
    const { mod } = load();
    mod.initPurchases();
    expect(P.configure).not.toHaveBeenCalled();
    expect(mod.usePurchases.getState().ready).toBe(true);
    expect(mod.usePurchases.getState().access.hasAccess).toBe(false);
  });

  it('configures once, loads customer info + offerings once', async () => {
    const { mod } = load();
    mod.initPurchases();
    mod.initPurchases();
    await flush(); await flush();
    expect(P.configure).toHaveBeenCalledTimes(1);
    expect(P.getCustomerInfo).toHaveBeenCalledTimes(1);
    expect(P.getOfferings).toHaveBeenCalledTimes(1);
    expect(P.addCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
    const st = mod.usePurchases.getState();
    expect(st.ready).toBe(true);
    expect(st.offeringStatus).toBe('loaded');
    expect(st.trialEligible).toEqual({ drip_pro_monthly: true, drip_pro_yearly: true });
  });

  it('expired subscriber is locked out', async () => {
    const { mod, settings } = load();
    mod.initPurchases();
    await flush();
    expect(mod.usePurchases.getState().access.hasAccess).toBe(false);
    expect(settings.useSettings.getState().isPro).toBe(false);
  });

  it('active subscriber gets access and the cache is written', async () => {
    P.getCustomerInfo.mockResolvedValue(activeSub());
    const { mod, settings } = load();
    mod.initPurchases();
    await flush();
    expect(mod.usePurchases.getState().access.kind).toBe('subscription');
    expect(settings.useSettings.getState().isPro).toBe(true);
    expect(settings.useSettings.getState().accessKind).toBe('subscription');
    expect(settings.useSettings.getState().accessExpiresAt).toBe('2099-01-01T00:00:00Z');
  });

  it('listener updates revoke access when the subscription lapses', async () => {
    P.getCustomerInfo.mockResolvedValue(activeSub());
    const { mod } = load();
    mod.initPurchases();
    await flush();
    expect(mod.usePurchases.getState().access.hasAccess).toBe(true);
    P.__listeners[0](noAccess());
    expect(mod.usePurchases.getState().access.hasAccess).toBe(false);
  });

  it('uses the hard_paywall placement offering when configured', async () => {
    const placed = { identifier: 'experiment_b', availablePackages: [annual], annual };
    P.getCurrentOfferingForPlacement.mockResolvedValueOnce(placed);
    const { mod } = load();
    mod.initPurchases();
    await flush(); await flush();
    expect(P.getCurrentOfferingForPlacement).toHaveBeenCalledWith('hard_paywall');
    expect(mod.usePurchases.getState().offering?.identifier).toBe('experiment_b');
  });

  it('without a placement, uses getOfferings().current and never another offering', async () => {
    const legacyOnly = { identifier: 'legacy', availablePackages: [{ identifier: '$rc_lifetime', packageType: 'LIFETIME', product: { identifier: 'com.triracle.drippro' } }] };
    P.getOfferings.mockResolvedValue({ current: null, all: { legacy: legacyOnly } });
    const { mod } = load();
    mod.initPurchases();
    await flush(); await flush();
    expect(mod.usePurchases.getState().offering).toBeNull();
    expect(mod.usePurchases.getState().offeringStatus).toBe('error');
  });

  it('an offering with only a lifetime package is treated as unavailable', async () => {
    const lifetimeOnly = { identifier: 'default', availablePackages: [{ identifier: '$rc_lifetime', packageType: 'LIFETIME', product: { identifier: 'com.triracle.drippro' } }] };
    P.getOfferings.mockResolvedValue({ current: lifetimeOnly, all: {} });
    const { mod } = load();
    mod.initPurchases();
    await flush(); await flush();
    expect(mod.usePurchases.getState().offering).toBeNull();
  });

  it('marks trial ineligible on iOS when StoreKit says so', async () => {
    P.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({
      drip_pro_yearly: { status: 1 },
      drip_pro_monthly: { status: 0 },
    });
    const { mod } = load();
    mod.initPurchases();
    await flush(); await flush(); await flush();
    expect(mod.usePurchases.getState().trialEligible).toEqual({ drip_pro_monthly: true, drip_pro_yearly: false });
  });

  it('getCustomerInfo failure still resolves to ready (falls back to cache)', async () => {
    P.getCustomerInfo.mockRejectedValue(new Error('offline'));
    const { mod } = load();
    mod.initPurchases();
    await flush();
    expect(mod.usePurchases.getState().ready).toBe(true);
  });
});

describe('selectHasAccess', () => {
  it('uses cached value until customer info arrives, then the live value', () => {
    const { mod } = load();
    const base = mod.usePurchases.getState();
    expect(mod.selectHasAccess({ ...base, customerInfo: null }, true)).toBe(true);
    expect(mod.selectHasAccess({ ...base, customerInfo: null }, false)).toBe(false);
    expect(mod.selectHasAccess({ ...base, ready: true, customerInfo: {} as any, access: { ...base.access, hasAccess: false } }, true)).toBe(false);
    expect(mod.selectHasAccess({ ...base, devUnlocked: true }, false)).toBe(true);
  });

  it('paying user who starts offline keeps access (regression)', async () => {
    P.getCustomerInfo.mockRejectedValue(new Error('offline'));
    const { mod, settings } = load();
    settings.useSettings.setState({ isPro: true, accessKind: 'subscription' });
    mod.initPurchases();
    await flush();
    const st = mod.usePurchases.getState();
    expect(st.ready).toBe(true);
    expect(mod.selectHasAccess(st, settings.useSettings.getState().isPro)).toBe(true);
  });

  it('cached subscription that expired while offline does not unlock (regression)', () => {
    const { mod } = load();
    const base = mod.usePurchases.getState();
    const now = Date.parse('2026-11-23T00:00:00Z');
    expect(mod.selectHasAccess({ ...base, customerInfo: null }, true, '2026-11-20T00:00:00Z', now)).toBe(false);
    expect(mod.selectHasAccess({ ...base, customerInfo: null }, true, '2026-12-20T00:00:00Z', now)).toBe(true);
    expect(mod.selectHasAccess({ ...base, customerInfo: null }, true, null, now)).toBe(true); // lifetime
  });

  it('lapsed subscriber keeps accessKind so the paywall can say welcome back', async () => {
    const { mod, settings } = load();
    settings.useSettings.setState({ isPro: true, accessKind: 'subscription' });
    mod.initPurchases();
    await flush();
    expect(settings.useSettings.getState()).toMatchObject({ isPro: false, accessKind: 'subscription' });
  });
});

describe('purchase / restore', () => {
  it('purchase success', async () => {
    P.purchasePackage.mockResolvedValue({ customerInfo: activeSub('TRIAL') });
    const { mod } = load();
    mod.initPurchases();
    await flush();
    await expect(mod.purchase(annual as any)).resolves.toBe('success');
    expect(mod.usePurchases.getState().access.kind).toBe('trial');
  });

  it('user cancel is not an error', async () => {
    P.purchasePackage.mockRejectedValue({ userCancelled: true, code: '1' });
    const { mod } = load();
    await expect(mod.purchase(annual as any)).resolves.toBe('cancelled');
    expect(mod.usePurchases.getState().lastError).toBeNull();
  });

  it('pending payment (Ask to Buy)', async () => {
    P.purchasePackage.mockRejectedValue({ code: '15' });
    const { mod } = load();
    await expect(mod.purchase(annual as any)).resolves.toBe('pending');
  });

  it('store error surfaces the code', async () => {
    P.purchasePackage.mockRejectedValue({ code: '10', message: 'network' });
    const { mod } = load();
    await expect(mod.purchase(annual as any)).resolves.toBe('error');
    expect(mod.usePurchases.getState().lastError?.code).toBe('10');
  });

  it('restore: legacy lifetime buyer gets access via the pro entitlement', async () => {
    P.restorePurchases.mockResolvedValue({
      entitlements: { active: { pro: { identifier: 'pro', isActive: true, willRenew: false, periodType: 'NORMAL', productIdentifier: 'com.triracle.drippro', expirationDate: null } }, all: {} },
      nonSubscriptionTransactions: [{ productIdentifier: 'com.triracle.drippro' }],
      allPurchasedProductIdentifiers: ['com.triracle.drippro'],
    });
    const { mod } = load();
    await expect(mod.restore()).resolves.toBe('restored');
    expect(mod.usePurchases.getState().access.kind).toBe('lifetime');
  });

  it('restore: nothing found', async () => {
    P.restorePurchases.mockResolvedValue(noAccess());
    const { mod } = load();
    await expect(mod.restore()).resolves.toBe('none');
  });
});

describe('resolveApiKey', () => {
  const env = { iosKey: 'appl_x', androidKey: 'goog_x', testStoreKey: 'test_x' };
  it('dev builds use the Test Store key on both platforms when set', () => {
    const { mod } = load();
    expect(mod.resolveApiKey('ios', true, env)).toBe('test_x');
    expect(mod.resolveApiKey('android', true, env)).toBe('test_x');
  });
  it('release builds always use the platform store key', () => {
    const { mod } = load();
    expect(mod.resolveApiKey('ios', false, env)).toBe('appl_x');
    expect(mod.resolveApiKey('android', false, env)).toBe('goog_x');
  });
  it('a Test Store key is refused in release builds', () => {
    const { mod } = load();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(mod.resolveApiKey('ios', false, { iosKey: 'test_leaked' })).toBeNull();
  });
  it('dev without a Test Store key falls back to the platform key', () => {
    const { mod } = load();
    expect(mod.resolveApiKey('ios', true, { iosKey: 'appl_x' })).toBe('appl_x');
  });
});

describe('Amplitude identity', () => {
  const amp = require('@amplitude/analytics-react-native');

  function loadWithAnalytics() {
    let mod: typeof import('@/store/purchases');
    let analytics: typeof import('@/lib/analytics');
    jest.isolateModules(() => {
      analytics = require('@/lib/analytics');
      mod = require('@/store/purchases');
    });
    return { mod: mod!, analytics: analytics! };
  }

  it('waits for Amplitude, then sets $amplitudeUserId and $amplitudeDeviceId once', async () => {
    amp.getDeviceId.mockReturnValue('device-1');
    amp.getUserId.mockReturnValue('u1');
    const { mod, analytics } = loadWithAnalytics();
    mod.initPurchases();
    await flush();
    expect(P.setAttributes).not.toHaveBeenCalled(); // Amplitude not initialised yet
    await analytics.initAnalytics();
    await flush(); await flush();
    expect(P.setAttributes).toHaveBeenCalledWith({ $amplitudeUserId: 'u1', $amplitudeDeviceId: 'device-1' });
    expect(amp.setUserId).toHaveBeenCalledWith('u1');

    // Same IDs again → no duplicate call
    await mod.syncAmplitudeIdentity('u1');
    expect(P.setAttributes).toHaveBeenCalledTimes(1);

    // Device ID changes → re-sent
    amp.getDeviceId.mockReturnValue('device-2');
    await mod.syncAmplitudeIdentity('u1');
    expect(P.setAttributes).toHaveBeenLastCalledWith({ $amplitudeUserId: 'u1', $amplitudeDeviceId: 'device-2' });
  });
});
