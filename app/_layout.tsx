import { C } from '@/constants/design';
import { StoreProvider, useStore } from '@/store';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { isLoaded } = useStore();

  if (!isLoaded) {
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
        <Stack.Screen name="edit" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <BottomSheetModalProvider>
          <AppContent />
        </BottomSheetModalProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
