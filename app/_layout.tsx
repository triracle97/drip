import CongratsModal from '@/components/CongratsModal';
import Onboarding from '@/components/onboarding/Onboarding';
import Paywall from '@/components/Paywall';
import { C } from '@/constants/design';
import '@/i18n';
import i18n, { resolveLanguage } from '@/i18n';
import { analyticsReady, initAnalytics, setUserProperties } from '@/lib/analytics';
import { StoreProvider, useStore } from '@/store';
import { initPurchases, selectHasAccess, usePurchases } from '@/store/purchases';
import { useSettings } from '@/store/settings';
import { blended } from '@/utils/calc';
import { hasPermission, rescheduleAllNotifications } from '@/utils/notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// Prevent system font scaling from affecting the app
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

// Configure RevenueCat once, before any component mounts
initPurchases();

// Initialize Amplitude analytics
initAnalytics();

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Max time to wait for RevenueCat on a cold start before showing the paywall. */
const ACCESS_WAIT_MS = 4000;

function AppContent() {
  const { isLoaded, subs, incomes } = useStore();
  const { notificationsEnabled, notificationTime, _hydrated, language, firstOpenDate, setFirstOpenDate, hasOnboarded } = useSettings();
  const cachedAccess = useSettings(s => s.isPro);
  const cachedExpiresAt = useSettings(s => s.accessExpiresAt);
  const hasAccess = usePurchases(s => selectHasAccess(s, cachedAccess, cachedExpiresAt));
  const purchasesReady = usePurchases(s => s.ready);
  const access = usePurchases(s => s.access);
  // Drip's own trial: remind the day before it converts (only while it will renew).
  const appTrialEndsAt = access.kind === 'trial' && access.willRenew ? access.expiresAt : null;
  const [waitedForAccess, setWaitedForAccess] = useState(false);

  // Amplitude user properties. (The Amplitude ↔ RevenueCat ID link is handled
  // in store/purchases.ts → syncAmplitudeIdentity, after Amplitude is ready.)
  useEffect(() => {
    let alive = true;
    analyticsReady().then(ok => {
      if (alive && ok) setUserProperties({ isPro: hasAccess, language });
    });
    return () => { alive = false; };
  }, [hasAccess, language]);

  // Reminders: rebuild whenever data / settings change (calls are coalesced).
  const rate = blended(incomes);
  useEffect(() => {
    if (!isLoaded || !_hydrated) return;
    rescheduleAllNotifications(subs, notificationsEnabled, notificationTime, rate, appTrialEndsAt);
  }, [isLoaded, _hydrated, subs, notificationsEnabled, notificationTime, rate, appTrialEndsAt]);

  // On foreground: dates have moved on (new day → new reminder window), and the
  // user may have revoked notification permission in system Settings.
  useEffect(() => {
    if (!isLoaded || !_hydrated) return;
    const sub = AppState.addEventListener('change', async next => {
      if (next !== 'active') return;
      const st = useSettings.getState();
      if (st.notificationsEnabled && !(await hasPermission())) {
        st.setNotificationsEnabled(false);
        return; // the settings change re-runs the effect above
      }
      rescheduleAllNotifications(subs, st.notificationsEnabled, st.notificationTime, rate, appTrialEndsAt);
    });
    return () => sub.remove();
  }, [isLoaded, _hydrated, subs, rate, appTrialEndsAt]);

  useEffect(() => {
    if (!_hydrated) return;
    const resolved = resolveLanguage(language);
    if (i18n.language !== resolved) {
      i18n.changeLanguage(resolved);
    }
  }, [_hydrated, language]);

  // Record first open date (once)
  useEffect(() => {
    if (_hydrated && !firstOpenDate) {
      setFirstOpenDate(new Date().toISOString());
    }
  }, [_hydrated, firstOpenDate, setFirstOpenDate]);

  // Don't flash the paywall at paying users while RevenueCat is still loading.
  useEffect(() => {
    if (purchasesReady) return;
    const timer = setTimeout(() => setWaitedForAccess(true), ACCESS_WAIT_MS);
    return () => clearTimeout(timer);
  }, [purchasesReady]);

  const accessResolved = purchasesReady || cachedAccess || waitedForAccess;

  if (!isLoaded || !_hydrated || (hasOnboarded && !accessResolved)) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={C.t3} />
      </View>
    );
  }

  return (
    <>
      {!hasOnboarded ? (
        <Onboarding />
      ) : hasAccess ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      ) : (
        // Hard paywall: rendered instead of the app, so no tab or deep link is reachable.
        <Paywall />
      )}
      <CongratsModal />
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

