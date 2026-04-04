import { DEFAULT_CURRENCY_CODE } from '@/constants/currencies';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
    currency: string;
    notificationsEnabled: boolean;
    notificationTime: string;
    language: string;
    isPro: boolean;
    hasOnboarded: boolean;
    showCongrats: boolean;
    pendingCongrats: boolean;
    hasRequestedReview: boolean;
    firstOpenDate: string;
    _hydrated: boolean;

    setCurrency: (code: string) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setNotificationTime: (time: string) => void;
    setLanguage: (lang: string) => void;
    setIsPro: (val: boolean) => void;
    setHasOnboarded: (val: boolean) => void;
    setShowCongrats: (val: boolean) => void;
    setPendingCongrats: (val: boolean) => void;
    setHasRequestedReview: (val: boolean) => void;
    setFirstOpenDate: (date: string) => void;
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            currency: DEFAULT_CURRENCY_CODE,
            notificationsEnabled: false,
            notificationTime: '08:00',
            language: 'auto',
            isPro: false,
            hasOnboarded: false,
            showCongrats: false,
            pendingCongrats: false,
            hasRequestedReview: false,
            firstOpenDate: '',
            _hydrated: false,

            setCurrency: (code) => set({ currency: code }),
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
            setNotificationTime: (time) => set({ notificationTime: time }),
            setLanguage: (lang) => set({ language: lang }),
            setIsPro: (val) => set({ isPro: val }),
            setHasOnboarded: (val) => set({ hasOnboarded: val }),
            setShowCongrats: (val) => set({ showCongrats: val }),
            setPendingCongrats: (val) => set({ pendingCongrats: val }),
            setHasRequestedReview: (val) => set({ hasRequestedReview: val }),
            setFirstOpenDate: (date) => set({ firstOpenDate: date }),
        }),
        {
            name: 'drip-settings',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => () => {
                useSettings.setState({ _hydrated: true });
            },
            partialize: (state) => ({
                currency: state.currency,
                notificationsEnabled: state.notificationsEnabled,
                notificationTime: state.notificationTime,
                language: state.language,
                hasOnboarded: state.hasOnboarded,
                hasRequestedReview: state.hasRequestedReview,
                firstOpenDate: state.firstOpenDate,
            }),
        },
    ),
);

/**
 * One-time migration from SQLite settings to Zustand/AsyncStorage.
 * Call this once on app startup after SQLite is ready.
 */
export async function migrateSettingsFromSQLite() {
    const MIGRATION_KEY = 'drip-settings-migrated';
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    if (migrated) return;

    try {
        const repo = await import('./repository');
        const settings = await repo.getAllSettings();

        const updates: Partial<SettingsState> = {};
        if (settings.currency) updates.currency = settings.currency;
        if (settings.notificationsEnabled !== undefined) {
            updates.notificationsEnabled = settings.notificationsEnabled === 'true';
        }
        if (settings.notificationTime) updates.notificationTime = settings.notificationTime;

        if (Object.keys(updates).length > 0) {
            useSettings.setState(updates);
        }
    } catch {
        // SQLite not ready or no settings — skip
    }

    await AsyncStorage.setItem(MIGRATION_KEY, '1');
}
