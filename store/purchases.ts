/**
 * Single source of truth for RevenueCat state.
 *
 * Previously every screen called `useRevenueCat()`, and each call fetched
 * offerings + customer info and registered its own listener (10+ network
 * round-trips and listeners at startup). Now `initPurchases()` runs once from
 * the root layout and components read from this store.
 */
import {
  analyticsReady,
  getAmplitudeUserId,
  getDeviceId,
  identify,
} from '@/lib/analytics';
import {
  AccessState,
  NO_ACCESS,
  freeTrialDays,
  pickPlans,
  resolveAccess,
} from '@/lib/entitlements';
import { useSettings } from '@/store/settings';
import { AppState, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesOffering,
  PurchasesPackage,
  STOREKIT_VERSION,
} from 'react-native-purchases';
import { create } from 'zustand';

export type PurchaseResult = 'success' | 'cancelled' | 'pending' | 'error';

/**
 * RevenueCat placement for the hard paywall. In the dashboard, Offerings →
 * Placements, map "hard_paywall" to any offering (or to an Experiment / Targeting
 * rule) to change what new users see without shipping an app update. If the
 * placement isn't configured, the current offering is used.
 */
export const PAYWALL_PLACEMENT = 'hard_paywall';
export type RestoreResult = 'restored' | 'none' | 'error';

interface PurchasesState {
  configured: boolean;
  /** True once customer info has been fetched (or failed) at least once. */
  ready: boolean;
  customerInfo: CustomerInfo | null;
  offering: PurchasesOffering | null;
  offeringStatus: 'idle' | 'loading' | 'loaded' | 'error';
  access: AccessState;
  /** productId → eligible for free trial (iOS check; Android filters offers itself). */
  trialEligible: Record<string, boolean>;
  /** Dev-only bypass so the simulator can be used without a sandbox account. */
  devUnlocked: boolean;
  lastError: { code?: string; message?: string } | null;
}

export const usePurchases = create<PurchasesState>(() => ({
  configured: false,
  ready: false,
  customerInfo: null,
  offering: null,
  offeringStatus: 'idle',
  access: NO_ACCESS,
  trialEligible: {},
  devUnlocked: false,
  lastError: null,
}));

function applyCustomerInfo(info: CustomerInfo | null) {
  if (!info) return;
  const access = resolveAccess(info);
  usePurchases.setState({ customerInfo: info, access, ready: true });
  syncAmplitudeIdentity(info.originalAppUserId);
  // Persisted cache so the next cold start can show the app instantly
  // (and offline) instead of flashing the paywall while RevenueCat loads.
  // accessKind is kept after a lapse so the paywall can greet returning users.
  const prevKind = useSettings.getState().accessKind;
  useSettings.getState().setAccessCache(
    access.hasAccess,
    access.hasAccess ? access.kind : prevKind,
    access.hasAccess ? access.expiresAt : null,
  );
}

/**
 * Effective access: live RevenueCat state once customer info has been fetched,
 * otherwise the persisted cache. Falling back to the cache (instead of "no access")
 * keeps paying users in the app when they start it offline.
 */
export function selectHasAccess(
  s: PurchasesState,
  cached: boolean,
  cachedExpiresAt: string | null = null,
  now: number = Date.now(),
): boolean {
  if (s.devUnlocked) return true;
  if (!s.customerInfo) {
    // A cached subscription that has since expired must not unlock the app offline.
    if (cached && cachedExpiresAt) return Date.parse(cachedExpiresAt) > now;
    return cached;
  }
  return s.access.hasAccess;
}

// ─── Amplitude ↔ RevenueCat identity ─────────────────────

let lastAmplitudeAttrs = '';

/**
 * Point Amplitude at the RevenueCat app user ID and give RevenueCat the
 * `$amplitudeUserId` / `$amplitudeDeviceId` attributes its Amplitude integration
 * needs. Waits for Amplitude to finish initialising (otherwise the device ID is
 * still unknown) and only re-sends when one of the IDs actually changed.
 */
export async function syncAmplitudeIdentity(rcUserId: string | null | undefined): Promise<void> {
  if (!rcUserId || !usePurchases.getState().configured) return;
  if (!(await analyticsReady())) return;
  identify(rcUserId);
  const userId = getAmplitudeUserId() ?? rcUserId;
  const deviceId = getDeviceId();
  const signature = `${userId}|${deviceId ?? ''}`;
  if (signature === lastAmplitudeAttrs) return;
  const attrs: Record<string, string> = { $amplitudeUserId: userId };
  if (deviceId) attrs.$amplitudeDeviceId = deviceId;
  try {
    await Purchases.setAttributes(attrs);
    lastAmplitudeAttrs = signature;
  } catch (e) {
    console.warn('[purchases] setAttributes failed', e);
  }
}

// ─── API keys ───────────────────────────────────────────

export interface KeyEnv {
  iosKey?: string;
  androidKey?: string;
  testStoreKey?: string;
}

/**
 * Pick the RevenueCat public SDK key.
 * - Dev builds (`__DEV__`): the Test Store key if one is set (works on both platforms).
 * - Release builds: always the platform store key. A Test Store key (`test_…`) is
 *   refused there, so it can never ship to users even if it ends up in the env.
 */
export function resolveApiKey(platform: string, isDev: boolean, env: KeyEnv): string | null {
  if (isDev && env.testStoreKey) return env.testStoreKey;
  const key = platform === 'ios' ? env.iosKey : env.androidKey;
  if (!key) return null;
  if (!isDev && key.startsWith('test_')) {
    console.error('[purchases] Test Store key in a release build — purchases disabled');
    return null;
  }
  return key;
}

let initialized = false;

export function initPurchases() {
  if (initialized) return;
  initialized = true;

  // Must stay as literal `process.env.EXPO_PUBLIC_*` reads so Expo inlines them.
  const apiKey = resolveApiKey(Platform.OS, __DEV__, {
    iosKey: process.env.EXPO_PUBLIC_RC_API_KEY,
    androidKey: process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY,
    testStoreKey: process.env.EXPO_PUBLIC_RC_TEST_STORE_KEY,
  });

  if (!apiKey) {
    console.warn('[purchases] No RevenueCat API key — purchases disabled');
    usePurchases.setState({ ready: true, offeringStatus: 'error' });
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({
      apiKey,
      ...(Platform.OS === 'ios' && { storeKitVersion: STOREKIT_VERSION.STOREKIT_2 }),
    });
    usePurchases.setState({ configured: true });
    if (Platform.OS === 'ios') {
      // Apple Search Ads attribution → RevenueCat charts by campaign / keyword.
      Purchases.enableAdServicesAttributionTokenCollection().catch(() => {});
    }
  } catch (e) {
    console.warn('[purchases] configure failed', e);
    usePurchases.setState({ ready: true, offeringStatus: 'error' });
    return;
  }

  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);

  refreshCustomerInfo();
  loadOfferings();

  // Renewals / expirations / refunds happen while the app is backgrounded.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshCustomerInfo();
  });
}

export async function refreshCustomerInfo(): Promise<void> {
  if (!usePurchases.getState().configured) return;
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('[purchases] getCustomerInfo failed', e);
    // Keep whatever we had; mark ready so the UI can fall back to the cache.
    usePurchases.setState({ ready: true });
  }
}

export async function loadOfferings(): Promise<void> {
  if (!usePurchases.getState().configured) return;
  if (usePurchases.getState().offeringStatus === 'loading') return;
  usePurchases.setState({ offeringStatus: 'loading' });
  try {
    // Placement first (returns null until "hard_paywall" exists in the dashboard),
    // then the project's current offering. Never any other offering.
    const placed = await Purchases.getCurrentOfferingForPlacement(PAYWALL_PLACEMENT).catch(() => null);
    const current = placed ?? (await Purchases.getOfferings()).current;
    const plans = pickPlans(current);
    const usable = !!current && (!!plans.monthly || !!plans.annual);
    if (current && !usable) {
      console.warn(`[purchases] offering "${current.identifier}" has no $rc_monthly / $rc_annual package`);
    }
    usePurchases.setState({
      offering: usable ? current : null,
      offeringStatus: usable ? 'loaded' : 'error',
    });
    if (usable) checkTrialEligibility(current!);
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    usePurchases.setState({ offeringStatus: 'error' });
  }
}

async function checkTrialEligibility(offering: PurchasesOffering) {
  const plans = pickPlans(offering);
  const products = [plans.monthly, plans.annual]
    .filter((p): p is PurchasesPackage => !!p)
    .map((p) => p.product);
  const base: Record<string, boolean> = {};
  for (const p of products) base[p.identifier] = freeTrialDays(p) != null;
  if (__DEV__) {
    for (const p of products) {
      console.log(`[purchases] ${p.identifier} ${p.priceString} intro=${JSON.stringify(p.introPrice)} freePhase=${JSON.stringify(p.defaultOption?.freePhase ?? null)}`);
    }
  }

  if (Platform.OS === 'ios' && products.length > 0) {
    try {
      const res = await Purchases.checkTrialOrIntroductoryPriceEligibility(
        products.map((p) => p.identifier),
      );
      for (const p of products) {
        const status = res[p.identifier]?.status;
        // UNKNOWN → keep showing the trial; INELIGIBLE / NO_OFFER → hide it.
        if (
          status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE ||
          status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS
        ) {
          base[p.identifier] = false;
        }
      }
    } catch (e) {
      console.warn('[purchases] eligibility check failed', e);
    }
  }
  usePurchases.setState({ trialEligible: base });
}

function errorCode(e: any): string | undefined {
  return e?.code ?? e?.userInfo?.readableErrorCode;
}

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    usePurchases.setState({ lastError: null });
    return resolveAccess(customerInfo).hasAccess ? 'success' : 'pending';
  } catch (e: any) {
    const code = errorCode(e);
    if (e?.userCancelled || code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return 'cancelled';
    }
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    usePurchases.setState({ lastError: { code, message: e?.message } });
    return 'error';
  }
}

export async function restore(): Promise<RestoreResult> {
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    usePurchases.setState({ lastError: null });
    return resolveAccess(info).hasAccess ? 'restored' : 'none';
  } catch (e: any) {
    usePurchases.setState({ lastError: { code: errorCode(e), message: e?.message } });
    return 'error';
  }
}

/**
 * Non-sensitive onboarding facts as RevenueCat subscriber attributes, so the
 * dashboard can segment / target offerings (e.g. people tracking 5+ subs).
 * Never send income amounts.
 */
export function setOnboardingAttributes(attrs: {
  subsPicked: number;
  hasIncome: boolean;
  remindersOn: boolean;
  currency: string;
  language: string;
}) {
  if (!usePurchases.getState().configured) return;
  Purchases.setAttributes({
    onboarding_subs_picked: String(attrs.subsPicked),
    onboarding_has_income: String(attrs.hasIncome),
    onboarding_reminders_on: String(attrs.remindersOn),
    app_currency: attrs.currency,
    app_language: attrs.language,
  }).catch(() => {});
}

export async function manageSubscription(): Promise<void> {
  try {
    await Purchases.showManageSubscriptions();
  } catch (e) {
    console.warn('[purchases] showManageSubscriptions failed', e);
  }
}

/** __DEV__ only: unlock without a store purchase (simulator / no sandbox account). */
export function devUnlock() {
  if (!__DEV__) return;
  usePurchases.setState({ devUnlocked: true });
}

/** Test helper. */
export function __resetPurchasesForTests() {
  initialized = false;
  lastAmplitudeAttrs = '';
  usePurchases.setState({
    configured: false,
    ready: false,
    customerInfo: null,
    offering: null,
    offeringStatus: 'idle',
    access: NO_ACCESS,
    trialEligible: {},
    devUnlocked: false,
    lastError: null,
  });
}
