import { C } from '@/constants/design';
import '@/i18n';
import i18n, { resolveLanguage } from '@/i18n';
import { StoreProvider, useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { rescheduleAllNotifications } from '@/utils/notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
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

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { isLoaded, subs } = useStore();
  const { notificationsEnabled, notificationTime, _hydrated, language } = useSettings();
  const appState = useRef(AppState.currentState);

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
