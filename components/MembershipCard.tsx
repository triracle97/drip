import { C, R } from '@/constants/design';
import { alertPurchaseError } from '@/hooks/useRevenueCat';
import { daysUntil } from '@/lib/entitlements';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { manageSubscription, restore, usePurchases } from '@/store/purchases';
import { useSettings } from '@/store/settings';
import { shortDate } from '@/utils/calc';
import { Crown } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Settings → current plan, renewal / trial-end date, manage + restore. */
export default function MembershipCard() {
  const { t } = useTranslation();
  const access = usePurchases((s) => s.access);
  const ready = usePurchases((s) => s.ready);
  const devUnlocked = usePurchases((s) => s.devUnlocked);
  const cachedKind = useSettings((s) => s.accessKind);
  const [restoring, setRestoring] = useState(false);

  const kind = ready ? access.kind : cachedKind;
  const expires = access.expiresAt ? new Date(access.expiresAt) : null;
  const productId = access.productId ?? '';
  const planName = /year|annual/i.test(productId)
    ? t('paywall.yearly')
    : /month/i.test(productId)
      ? t('paywall.monthly')
      : null;

  let title = t('membership.pro');
  let detail = '';
  if (devUnlocked) {
    detail = 'Dev unlock (this session only)';
  } else if (kind === 'lifetime') {
    title = t('membership.lifetime');
    detail = t('membership.lifetimeDesc');
  } else if (kind === 'trial' && expires) {
    title = t('membership.trial');
    detail = access.willRenew
      ? t('membership.trialEnds', { date: shortDate(expires), count: daysUntil(access.expiresAt) })
      : t('membership.trialEndsNoRenew', { date: shortDate(expires) });
  } else if (kind === 'subscription' && expires) {
    title = planName ? `${t('membership.pro')} · ${planName}` : t('membership.pro');
    detail = access.willRenew
      ? t('membership.renews', { date: shortDate(expires) })
      : t('membership.expires', { date: shortDate(expires) });
  }

  const canManage = kind === 'trial' || kind === 'subscription';

  const onRestore = async () => {
    track(AnalyticsEvents.RESTORE_TAPPED, { source: 'settings' });
    setRestoring(true);
    const res = await restore();
    setRestoring(false);
    if (res === 'restored') Alert.alert(t('pro.restoreSuccess'));
    else if (res === 'none') Alert.alert(t('pro.restoreNone'), t('paywall.restoreNoneDesc'));
    else alertPurchaseError(usePurchases.getState().lastError?.code);
  };

  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={s.icon}>
          <Crown size={18} color={C.gold} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {!!detail && <Text style={s.detail}>{detail}</Text>}
        </View>
      </View>
      <View style={s.actions}>
        {canManage && (
          <TouchableOpacity style={s.btn} onPress={manageSubscription} activeOpacity={0.8}>
            <Text style={s.btnText}>{t('membership.manage')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onRestore} activeOpacity={0.8} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator size="small" color={C.t2} />
          ) : (
            <Text style={[s.btnText, { color: C.t2 }]}>{t('pro.restorePurchase')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    marginTop: 12,
    backgroundColor: C.bg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: C.t1 },
  detail: { fontSize: 13, color: C.t2, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    borderRadius: R.pill,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: C.black,
  },
  btnGhost: { backgroundColor: C.bgSub },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
