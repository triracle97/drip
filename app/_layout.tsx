import { StoreProvider } from '@/store';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <StoreProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="edit" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />

      </Stack>
      <StatusBar style="dark" />
    </StoreProvider>
  );
}
