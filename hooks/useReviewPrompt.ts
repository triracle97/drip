import { useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { useCallback } from 'react';

/**
 * Hook that encapsulates the in-app review prompt logic.
 * 
 * Triggers the native review dialog (SKStoreReviewController on iOS,
 * ReviewManager on Android) when smart conditions are met.
 * 
 * Two trigger points:
 * 1. After adding the first subscription (via `maybeRequestAfterAdd`)
 * 2. After a positive trial decision (via `maybeRequestAfterTrialKeep`)
 */
export function useReviewPrompt() {
    const { subs } = useStore();
    const hasRequestedReview = useSettings(s => s.hasRequestedReview);
    const firstOpenDate = useSettings(s => s.firstOpenDate);
    const setHasRequestedReview = useSettings(s => s.setHasRequestedReview);

    const requestReview = useCallback(async () => {
        // Mark as requested before calling (even if OS decides not to show)
        setHasRequestedReview(true);

        try {
            const StoreReview = await import('expo-store-review');
            const available = await StoreReview.isAvailableAsync();
            if (available) {
                await StoreReview.requestReview();
            }
        } catch {
            // Silently fail — review prompt is non-critical
        }
    }, [setHasRequestedReview]);

    /**
     * Call after a subscription is successfully added.
     * Triggers on the first subscription only.
     */
    const maybeRequestAfterAdd = useCallback(async () => {
        if (hasRequestedReview) return;

        // Only trigger after the FIRST sub is added (subs.length is 0 before the addSub dispatch)
        if (subs.length > 0) return;

        // Wait a beat so the sheet dismissal feels natural
        await new Promise(r => setTimeout(r, 2000));

        await requestReview();
    }, [hasRequestedReview, subs.length, requestReview]);

    /**
     * Call after a trial decision (keep/cancel).
     * Only triggers on "kept" decisions (positive sentiment).
     */
    const maybeRequestAfterTrialKeep = useCallback(async (decision: 'kept' | 'cancelled') => {
        if (decision !== 'kept') return;
        if (hasRequestedReview) return;

        // Need at least 3 days since first open
        if (firstOpenDate) {
            const daysSince = (Date.now() - new Date(firstOpenDate).getTime()) / 86400000;
            if (daysSince < 3) return;
        }

        // Wait so it doesn't feel jarring after sheet dismiss
        await new Promise(r => setTimeout(r, 1500));

        await requestReview();
    }, [hasRequestedReview, firstOpenDate, requestReview]);

    /**
     * Manually request a review (e.g. from "Rate Us" in Settings).
     * Always opens the store review, ignoring gating logic.
     */
    const requestReviewManually = useCallback(async () => {
        try {
            const StoreReview = await import('expo-store-review');
            const hasAction = await StoreReview.hasAction();
            if (hasAction) {
                await StoreReview.requestReview();
            }
        } catch {
            // Silently fail
        }
    }, []);

    return { maybeRequestAfterAdd, maybeRequestAfterTrialKeep, requestReviewManually };
}
