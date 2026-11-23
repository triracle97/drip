# Subscriptions (RevenueCat)

Drip is a hard paywall: the app is usable only while the RevenueCat entitlement
`pro` is active. Store and dashboard setup is the source of truth below — the code
in `store/purchases.ts`, `lib/entitlements.ts` and `components/Paywall.tsx` matches it.

## Identifiers

| What | Value |
|---|---|
| Entitlement (the only thing that unlocks the app) | `pro` |
| Offering | `default` (marked Current) |
| Placement (app asks for it first) | `hard_paywall` — not created yet; until it exists the app uses the current offering |
| Monthly package | `$rc_monthly` → iOS `drip_pro_monthly`, Android `drip_pro:monthly`, Test Store `drip_pro_monthly` — $2.99/month, 3-day free trial |
| Annual package (preselected) | `$rc_annual` → iOS `drip_pro_yearly`, Android `drip_pro:yearly`, Test Store `drip_pro_yearly` — $14.99/year, 3-day free trial |
| Legacy one-time product | iOS `com.triracle.drippro` — attached to `pro`, not in the offering. Old buyers keep access through `pro` and can use **Restore**. |
| Unused | Entitlement "Drip Pro" (old). The code never reads it. |

Rules the code follows:
- Access = `customerInfo.entitlements.active["pro"]` only (`resolveAccess`). Never product IDs, purchase history, or other entitlements.
- Offering = `getCurrentOfferingForPlacement("hard_paywall")`, else `getOfferings().current`. No other offering is ever used.
- Packages are read via `offering.annual` / `offering.monthly` (or `$rc_annual` / `$rc_monthly`). A lifetime package is ignored.
- Prices, savings % and "per month" come from the store products. The free-trial copy appears only when the product has a free intro offer (iOS `introPrice`, Android `defaultOption.freePhase`) and, on iOS, the user is still eligible. Nothing is hard-coded; if plans can't load the paywall shows "Couldn't load plans" + **Try again**.
- After `Purchases.configure`, iOS calls `enableAdServicesAttributionTokenCollection()` (Apple Search Ads).
- `$amplitudeUserId` / `$amplitudeDeviceId` are set with `Purchases.setAttributes` once Amplitude has initialised, and again whenever either ID changes (`syncAmplitudeIdentity`).
- Paywall links: Terms → Apple standard EULA, Privacy → https://drip.superlarva.com/privacy (`constants/legal.ts`).
- Onboarding sets attributes `onboarding_subs_picked`, `onboarding_has_income`, `onboarding_reminders_on`, `app_currency`, `app_language` (never income amounts).

## API keys

| Build | Key | Where |
|---|---|---|
| EAS development / preview / production, iOS | `appl_fkZokPhKhPdrUCsgFcnHpqpdnBm` | `eas.json` → `EXPO_PUBLIC_RC_API_KEY` |
| EAS development / preview / production, Android | `goog_TeqiegJoHxZukHBOgkuSxFqqFUh` | `eas.json` → `EXPO_PUBLIC_RC_GOOGLE_API_KEY` |
| Local dev (`npx expo start` / `expo run`) | RevenueCat Test Store key (`test_…`) | `.env` → `EXPO_PUBLIC_RC_TEST_STORE_KEY` (gitignored; see `.env.example`) |

`resolveApiKey()` uses the Test Store key only when `__DEV__` is true, and refuses any
`test_` key in a release build, so it can't ship even if it leaks into the env.
`.env` is gitignored and EAS doesn't upload it.

## Testing

### Test Store (fastest, simulator / emulator)
1. Put the Test Store key in `.env` as `EXPO_PUBLIC_RC_TEST_STORE_KEY`.
2. `npx expo start`, open the dev build. Fresh install → onboarding → paywall.
3. Buy either plan. RevenueCat shows its Test Store purchase sheet; `pro` becomes active.
4. To see the paywall again, delete the app (new anonymous user) or use a new install.

### iOS sandbox (real StoreKit)
1. App Store Connect → Users and Access → Sandbox → create a tester.
2. Install an EAS development or preview build (uses the `appl_` key).
3. On the device: Settings → App Store → Sandbox Account → sign in.
4. Buy a plan. Sandbox renews fast (a 1-year plan renews every hour, a 3-day trial lasts minutes), so you can watch renewals/expiry and the "Welcome back" paywall.
5. Legacy buyers: buy `com.triracle.drippro` with a sandbox account that already owns it, then tap **Restore** on the paywall.

### Google Play (license tester)
1. Play Console → Setup → License testing → add the tester's Google account.
2. Upload a build to the internal testing track and install it from the Play link with that account.
3. Buy a plan; test card purchases renew every few minutes.

### Automated
`yarn test` covers access rules, offering selection, key selection, Amplitude attribute sync and the paywall UI (`__tests__/entitlements.test.ts`, `purchases.test.ts`, `Paywall.test.tsx`).

## App Review screenshot of the paywall
- Simulator + Test Store key: fresh install → go through onboarding (Skip works) → paywall shows real Test Store prices. `⌘S` in Simulator saves a screenshot.
- Already subscribed in Test Store? Delete and reinstall the app to get a new anonymous user.
- The first subscription group must ship with a new app version; submit the subscriptions together with that build.
