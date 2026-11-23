/**
 * Links required on the paywall for auto-renewing subscriptions
 * (App Store Review Guideline 3.1.2 / Google Play subscription policy).
 *
 * TERMS_URL defaults to Apple's standard EULA. PRIVACY_URL is the policy linked
 * from the App Store listing (drip.superlarva.com). Both can be overridden via env.
 */
export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://drip.superlarva.com/privacy';
