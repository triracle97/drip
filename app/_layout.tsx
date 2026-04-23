import CongratsModal from '@/components/CongratsModal';
import OnboardingSheet from '@/components/OnboardingSheet';
import { C } from '@/constants/design';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import '@/i18n';
import i18n, { resolveLanguage } from '@/i18n';
import { getAmplitudeUserId, getDeviceId, identify, initAnalytics, setUserProperties } from '@/lib/analytics';
import { StoreProvider, useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { rescheduleAllNotifications } from '@/utils/notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, Platform, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL, STOREKIT_VERSION } from 'react-native-purchases';
import 'react-native-reanimated';

// Prevent system font scaling from affecting the app
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

// Configure RevenueCat synchronously at module level — before any component mounts
const rcApiKey = Platform.OS === 'ios'
  ? process.env.EXPO_PUBLIC_RC_API_KEY
  : process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY;
if (rcApiKey) {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({
    apiKey: rcApiKey,
    ...(Platform.OS === 'ios' && { storeKitVersion: STOREKIT_VERSION.STOREKIT_2 }),
  });
}

// Initialize Amplitude analytics
initAnalytics();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { isLoaded, subs } = useStore();
  const { notificationsEnabled, notificationTime, _hydrated, language, firstOpenDate, setFirstOpenDate } = useSettings();
  const appState = useRef(AppState.currentState);

  const { isPro, customerInfo } = useRevenueCat();

  // Two-way identity sync: Amplitude ↔ RevenueCat
  useEffect(() => {
    if (!customerInfo?.originalAppUserId) return;

    const rcUserId = customerInfo.originalAppUserId;

    // 1. Set Amplitude userId = RC App User ID so client events are merged
    identify(rcUserId);

    // 2. Set RC subscriber attributes with Amplitude identifiers
    //    so RevenueCat server-side events land on the right Amplitude user
    const amplitudeDeviceId = getDeviceId();
    const amplitudeUserId = getAmplitudeUserId() ?? rcUserId;

    const attrs: Record<string, string> = {
      $amplitudeUserId: amplitudeUserId,
    };
    if (amplitudeDeviceId) {
      attrs.$amplitudeDeviceId = amplitudeDeviceId;
    }
    Purchases.setAttributes(attrs);

    setUserProperties({ isPro, language });
  }, [customerInfo, isPro, language]);

  useEffect(() => {
    if (!isLoaded) return;
    // Reschedule on initial load
    rescheduleAllNotifications(subs, notificationsEnabled, notificationTime);

    // Reschedule when app comes to foreground
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        rescheduleAllNotifications(subs, notificationsEnabled, notificationTime);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isLoaded, subs, notificationsEnabled, notificationTime]);

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
  }, [_hydrated, firstOpenDate]);

  if (!isLoaded || !_hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={C.t3} />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <OnboardingSheet />
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

