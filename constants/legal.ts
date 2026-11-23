/**
 * Links required on the paywall for auto-renewing subscriptions
 * (App Store Review Guideline 3.1.2 / Google Play subscription policy).
 *
 * TERMS_URL defaults to Apple's standard EULA. Set PRIVACY_URL to the same
 * privacy policy URL configured in App Store Connect / Play Console.
 */
export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || '';
