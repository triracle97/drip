import * as amplitude from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';

// ── Keys ───────────────────────────────────────────────
const DEV_KEY = 'YOUR_AMPLITUDE_DEV_KEY_HERE';

function getApiKey(): string | null {
    const envKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
    if (envKey) return envKey;
    if (__DEV__) return DEV_KEY;
    // No key in production → skip analytics silently
    return null;
}

// ── Init ───────────────────────────────────────────────
let initialised = false;

export async function initAnalytics(): Promise<void> {
    const key = getApiKey();
    if (!key || initialised) return;
    try {
        await amplitude.init(key, undefined, { disableCookies: true }).promise;
        await amplitude.add(new SessionReplayPlugin()).promise;
        initialised = true;
    } catch (e) {
        console.warn('[Analytics] init failed', e);
    }
}

// ── Track ──────────────────────────────────────────────
export function track(
    event: string,
    properties?: Record<string, unknown>,
): void {
    if (!initialised) return;
    amplitude.track(event, properties);
}

// ── Identity ───────────────────────────────────────────
export function identify(userId: string): void {
    if (!initialised) return;
    amplitude.setUserId(userId);
}

export function setUserProperties(
    props: Record<string, unknown>,
): void {
    if (!initialised) return;
    const identifyObj = new amplitude.Identify();
    for (const [key, value] of Object.entries(props)) {
        identifyObj.set(key, value as any);
    }
    amplitude.identify(identifyObj);
}

// ── Getters ─────────────────────────────────────────────
/** Returns the Amplitude Device ID (needed to set $amplitudeDeviceId on RevenueCat). */
export function getDeviceId(): string | undefined {
    return amplitude.getDeviceId();
}

/** Returns the Amplitude User ID currently set. */
export function getAmplitudeUserId(): string | undefined {
    return amplitude.getUserId();
}

// ── Event Constants ─────────────────────────────────────
// Centralised event names to avoid typos and make Amplitude taxonomy clean.
export const AnalyticsEvents = {
    // Onboarding
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
    ONBOARDING_GET_STARTED: 'onboarding_get_started',
    ONBOARDING_INCOME_SUBMITTED: 'onboarding_income_submitted',
    ONBOARDING_INCOME_SKIPPED: 'onboarding_income_skipped',
    ONBOARDING_COMPLETED: 'onboarding_completed',

    // Paywall & Purchase
    PAYWALL_VIEWED: 'paywall_viewed',
    PAYWALL_CTA_TAPPED: 'paywall_cta_tapped',
    PAYWALL_DISMISSED: 'paywall_dismissed',
    PURCHASE_STARTED: 'purchase_started',
    PURCHASE_COMPLETED: 'purchase_completed',
    PURCHASE_FAILED: 'purchase_failed',
    RESTORE_TAPPED: 'restore_tapped',

    // Subscription Management
    SUB_ADDED: 'subscription_added',
    SUB_EDITED: 'subscription_edited',
    SUB_REMOVED: 'subscription_removed',
    SUB_TOGGLED_ACTIVE: 'subscription_toggled_active',

    // Trial Management
    TRIAL_VIEWED: 'trial_sheet_viewed',
    TRIAL_DECIDED: 'trial_decided',

    // Income
    INCOME_UPDATED: 'income_updated',

    // Navigation
    TAB_VIEWED: 'tab_viewed',

    // Settings
    CURRENCY_CHANGED: 'currency_changed',
    LANGUAGE_CHANGED: 'language_changed',
    NOTIFICATIONS_TOGGLED: 'notifications_toggled',
    RATE_US_TAPPED: 'rate_us_tapped',

    // Pro Feature Gate
    PRO_GATE_HIT: 'pro_gate_hit',

    // Review Prompt
    REVIEW_PROMPTED: 'review_prompted',
} as const;
