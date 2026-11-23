import { ENTITLEMENT_ID } from '@/lib/entitlements';
import {
  manageSubscription,
  purchase,
  restore,
  selectHasAccess,
  usePurchases,
} from '@/store/purchases';
import { useSettings } from '@/store/settings';
import i18n from '@/i18n';
import { Alert } from 'react-native';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

/** Maps a RevenueCat error code to a user-facing alert. */
export function alertPurchaseError(code?: string): void {
  const t = i18n.t.bind(i18n);
  switch (code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      Alert.alert(t('paywall.err.networkTitle'), t('paywall.err.network'));
      return;
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
    case PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR:
      Alert.alert(t('paywall.err.notAllowedTitle'), t('paywall.err.notAllowed'));
      return;
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      Alert.alert(t('paywall.err.unavailableTitle'), t('paywall.err.unavailable'));
      return;
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      Alert.alert(t('paywall.err.ownedTitle'), t('paywall.err.owned'));
      return;
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      Alert.alert(t('paywall.err.storeTitle'), t('paywall.err.store'));
      return;
    default:
      Alert.alert(t('paywall.err.genericTitle'), t('paywall.err.generic'));
  }
}

/**
 * Read-only view of the shared purchases store plus actions.
 * Safe to call from many components — it does not fetch or subscribe to RevenueCat itself.
 */
export function useRevenueCat() {
  const cached = useSettings((s) => s.isPro);
  const cachedExpiresAt = useSettings((s) => s.accessExpiresAt);
  const isPro = usePurchases((s) => selectHasAccess(s, cached, cachedExpiresAt));
  const access = usePurchases((s) => s.access);
  const offering = usePurchases((s) => s.offering);
  const customerInfo = usePurchases((s) => s.customerInfo);
  const isReady = usePurchases((s) => s.ready);

  return {
    isPro,
    access,
    isReady,
    customerInfo,
    currentOffering: offering,
    purchasePackage: purchase,
    restorePurchases: restore,
    presentCustomerCenter: manageSubscription,
  };
}

export { ENTITLEMENT_ID };
