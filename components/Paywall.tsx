/**
 * Hard paywall shown whenever the user has no access (new users after
 * onboarding, lapsed subscribers). It cannot be dismissed.
 *
 * Plans come from RevenueCat (placement "hard_paywall", else the current
 * offering): $rc_annual (preselected) and $rc_monthly. Every price, the trial
 * length and the savings badge are read from the store products — nothing is
 * hard-coded. If plans can't be loaded the paywall says so and offers a retry.
 * Layout follows the "honest trial" pattern: benefits → trial timeline with real
 * dates → plans → "no payment due now" → CTA → billing terms.
 */
import { C, R } from '@/constants/design';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { alertPurchaseError } from '@/hooks/useRevenueCat';
import {
  annualPerMonth,
  annualSavingsPct,
  cleanPrice,
  freeTrialDays,
  pickPlans,
} from '@/lib/entitlements';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { dripMinutesPerMonth } from '@/lib/onboarding';
import { useStore } from '@/store';
import { devUnlock, loadOfferings, purchase, restore, usePurchases } from '@/store/purchases';
import { useSettings } from '@/store/settings';
import { blended, shortDate } from '@/utils/calc';
import * as WebBrowser from 'expo-web-browser';
import { Bell, Check, CircleCheck, Lock, LockOpen, RefreshCw, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanKey = 'annual' | 'monthly';

const BENEFITS = ['paywall.benefit.hours', 'paywall.benefit.reminders', 'paywall.benefit.insights'] as const;

export default function Paywall() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const offering = usePurchases((s) => s.offering);
  const offeringStatus = usePurchases((s) => s.offeringStatus);
  const trialEligible = usePurchases((s) => s.trialEligible);
  const accessKind = useSettings((s) => s.accessKind);
  const currency = useSettings((s) => s.currency);
  const { incomes } = useStore();
  const [selected, setSelected] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);

  const plans = useMemo(() => pickPlans(offering), [offering]);
  const savings = annualSavingsPct(plans);
  const perMonth = annualPerMonth(plans);
  // Never fall back to the other plan: what the card shows is what gets bought.
  const selectedPkg = plans[selected];
  const anyStorePlan = !!plans.annual || !!plans.monthly;
  const loadingPlans = !anyStorePlan && (offeringStatus === 'loading' || offeringStatus === 'idle');
  const plansUnavailable = !anyStorePlan && !loadingPlans;

  // Only one plan configured in the store → select it.
  useEffect(() => {
    if (!plans.annual && plans.monthly) setSelected('monthly');
  }, [plans.annual, plans.monthly]);
  const savingsPct = savings > 0 ? savings : null;
  const perMonthLabel = perMonth ? cleanPrice(perMonth) : null;

  // Trial copy only when the selected store product really has a free intro offer
  // (iOS introPrice / Android free phase) and the user is eligible for it.
  const trialDays = useMemo(() => {
    if (!selectedPkg) return null;
    const days = freeTrialDays(selectedPkg.product);
    if (days == null) return null;
    return trialEligible[selectedPkg.product.identifier] === false ? null : days;
  }, [selectedPkg, trialEligible]);

  // Returning subscribers whose plan lapsed see "welcome back" copy.
  const isLapsed = accessKind === 'subscription' || accessKind === 'trial';

  // "Drip costs you 10 min of work a month" — only when currencies line up.
  const rate = blended(incomes);
  const annualProduct = plans.annual?.product;
  const minutes = annualProduct
    ? dripMinutesPerMonth(annualProduct.price, annualProduct.currencyCode, currency, rate)
    : null;

  useEffect(() => {
    track(AnalyticsEvents.PAYWALL_VIEWED, { source: 'hard_paywall', lapsed: isLapsed });
    if (offeringStatus === 'idle' || offeringStatus === 'error') loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceOf = (key: PlanKey) => cleanPrice(plans[key]?.product.priceString);

  const handlePurchase = async () => {
    if (busy) return;
    track(AnalyticsEvents.PAYWALL_CTA_TAPPED, { source: 'hard_paywall', plan: selected });
    if (!selectedPkg && anyStorePlan) {
      // The other plan exists but this one isn't configured in the store.
      Alert.alert(t('paywall.err.unavailableTitle'), t('paywall.err.unavailable'));
      return;
    }
    if (!selectedPkg) {
      if (__DEV__) {
        Alert.alert('Dev build', 'No store products loaded.', [
          { text: 'Retry', onPress: () => loadOfferings() },
          { text: 'Unlock (dev only)', onPress: devUnlock },
        ]);
        return;
      }
      loadOfferings();
      return;
    }
    setBusy('purchase');
    track(AnalyticsEvents.PURCHASE_STARTED, {
      source: 'hard_paywall',
      product: selectedPkg.product.identifier,
      trial: trialDays != null,
    });
    const result = await purchase(selectedPkg);
    setBusy(null);
    if (result === 'success') {
      track(AnalyticsEvents.PURCHASE_COMPLETED, {
        source: 'hard_paywall',
        product: selectedPkg.product.identifier,
        trial: trialDays != null,
      });
      useSettings.getState().setShowCongrats(true);
    } else if (result === 'pending') {
      Alert.alert(t('paywall.pendingTitle'), t('paywall.pending'));
    } else if (result === 'error') {
      track(AnalyticsEvents.PURCHASE_FAILED, {
        source: 'hard_paywall',
        code: usePurchases.getState().lastError?.code,
      });
      alertPurchaseError(usePurchases.getState().lastError?.code);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    track(AnalyticsEvents.RESTORE_TAPPED, { source: 'hard_paywall' });
    setBusy('restore');
    const result = await restore();
    setBusy(null);
    if (result === 'restored') {
      Alert.alert(t('pro.restoreSuccess'));
    } else if (result === 'none') {
      Alert.alert(t('pro.restoreNone'), t('paywall.restoreNoneDesc'));
    } else {
      alertPurchaseError(usePurchases.getState().lastError?.code);
    }
  };

  const open = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  const renewPrice = !selectedPkg
    ? ''
    : selected === 'annual'
      ? t('paywall.perYear', { price: priceOf('annual') })
      : t('paywall.perMonth', { price: priceOf('monthly') });

  const headline = isLapsed
    ? t('paywall.headlineLapsed')
    : trialDays != null
      ? t('paywall.headlineTrial', { count: trialDays })
      : t('paywall.headline');

  // Real calendar dates for the trial timeline.
  const today = new Date();
  const remindDate = new Date(today);
  const endDate = new Date(today);
  if (trialDays != null) {
    remindDate.setDate(today.getDate() + Math.max(0, trialDays - 1));
    endDate.setDate(today.getDate() + trialDays);
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topRow}>
        <TouchableOpacity onPress={handleRestore} disabled={!!busy} hitSlop={10} testID="paywall-restore">
          {busy === 'restore' ? (
            <ActivityIndicator size="small" color={C.t3} />
          ) : (
            <Text style={s.restore}>{t('paywall.restore')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.headline}>{headline}</Text>
        {minutes != null && (
          <View style={s.personalPill}>
            <Text style={s.personalText}>{t('paywall.costsYou', { count: minutes })}</Text>
          </View>
        )}

        <View style={s.benefits}>
          {BENEFITS.map((key, i) => (
            <Animated.View key={key} entering={FadeInDown.duration(300).delay(60 * i)} style={s.benefitRow}>
              <View style={s.benefitCheck}>
                <Check size={12} color="#fff" strokeWidth={3.5} />
              </View>
              <Text style={s.benefitText}>{t(key)}</Text>
            </Animated.View>
          ))}
        </View>

        {trialDays != null && (
          <View style={s.timeline}>
            <TimelineRow
              Icon={LockOpen}
              active
              title={t('paywall.tl.today', { date: shortDate(today) })}
              desc={t('paywall.tl.todayDesc')}
            />
            <TimelineRow
              Icon={Bell}
              title={shortDate(remindDate)}
              desc={t('paywall.tl.remindDesc')}
            />
            <TimelineRow
              Icon={Sparkles}
              last
              title={shortDate(endDate)}
              desc={t('paywall.tl.endDesc', { price: renewPrice })}
            />
          </View>
        )}

        {loadingPlans ? (
          <View style={[s.plans, s.plansLoading]} testID="paywall-loading">
            <ActivityIndicator color={C.t3} />
          </View>
        ) : plansUnavailable ? (
          <View style={[s.plans, s.plansLoading]} testID="paywall-unavailable">
            <Text style={s.unavailableText}>{t('paywall.err.loadPlans')}</Text>
          </View>
        ) : (
          <View style={s.plans}>
            {plans.annual && (
              <PlanCard
                selected={selected === 'annual'}
                onPress={() => setSelected('annual')}
                title={t('paywall.yearly')}
                price={t('paywall.perYear', { price: priceOf('annual') })}
                detail={perMonthLabel ? t('paywall.perMonthEq', { price: perMonthLabel }) : null}
                badge={savingsPct ? t('paywall.save', { pct: savingsPct }) : null}
                testID="plan-annual"
              />
            )}
            {plans.monthly && (
              <PlanCard
                selected={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
                title={t('paywall.monthly')}
                price={t('paywall.perMonth', { price: priceOf('monthly') })}
                detail={null}
                badge={null}
                testID="plan-monthly"
              />
            )}
          </View>
        )}

        <View style={s.trustRow}>
          <Lock size={13} color={C.t3} strokeWidth={2.4} />
          <Text style={s.trustText}>{t('paywall.private')}</Text>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
        {trialDays != null && (
          <View style={s.noPaymentRow}>
            <CircleCheck size={16} color={C.green} strokeWidth={2.6} />
            <Text style={s.noPayment}>{t('paywall.noPaymentNow')}</Text>
          </View>
        )}
        {plansUnavailable && !__DEV__ ? (
          <TouchableOpacity
            style={s.cta}
            onPress={() => loadOfferings()}
            activeOpacity={0.85}
            testID="paywall-retry"
          >
            <View style={s.retryRow}>
              <RefreshCw size={17} color="#fff" strokeWidth={2.4} />
              <Text style={s.ctaText}>{t('paywall.retry')}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.cta, (busy === 'purchase' || loadingPlans) && { opacity: 0.6 }]}
            onPress={handlePurchase}
            activeOpacity={0.85}
            disabled={!!busy || loadingPlans}
            testID="paywall-cta"
          >
            {busy === 'purchase' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.ctaText}>
                {trialDays != null ? t('paywall.ctaTrial', { count: trialDays }) : t('paywall.ctaSubscribe')}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {!!selectedPkg && (
          <Text style={s.disclosure}>
            {trialDays != null
              ? t('paywall.disclosureTrial', { count: trialDays, renew: renewPrice })
              : t('paywall.disclosure', { renew: renewPrice })}
          </Text>
        )}
        <View style={s.links}>
          <TouchableOpacity onPress={() => open(TERMS_URL)} hitSlop={8}>
            <Text style={s.link}>{t('paywall.terms')}</Text>
          </TouchableOpacity>
          {!!PRIVACY_URL && (
            <>
              <Text style={s.dot}>·</Text>
              <TouchableOpacity onPress={() => open(PRIVACY_URL)} hitSlop={8}>
                <Text style={s.link}>{t('paywall.privacy')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function TimelineRow({
  Icon,
  title,
  desc,
  active,
  last,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <View style={s.tlRow}>
      <View style={s.tlRail}>
        <View style={[s.tlNode, active && s.tlNodeActive]}>
          <Icon size={16} color={active ? '#fff' : C.primary} strokeWidth={2.4} />
        </View>
        {!last && <View style={s.tlLine} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 8 }}>
        <Text style={s.tlTitle}>{title}</Text>
        <Text style={s.tlDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  title,
  price,
  detail,
  badge,
  testID,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  detail: string | null;
  badge: string | null;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.plan, selected && s.planSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
    >
      <View style={[s.radio, selected && s.radioOn]}>
        {selected && <Check size={13} color="#fff" strokeWidth={3.5} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.planTitle}>{title}</Text>
        {!!detail && <Text style={s.planDetail}>{detail}</Text>}
      </View>
      <Text style={s.planPrice}>{price}</Text>
      {!!badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const TINT = 'rgba(23,123,156,0.08)';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topRow: { height: 44, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 24 },
  restore: { fontSize: 15, fontWeight: '600', color: C.t2 },
  scroll: { paddingHorizontal: 24, paddingBottom: 16 },
  headline: { fontSize: 28, fontWeight: '800', color: C.t1, letterSpacing: -0.7, lineHeight: 33 },
  personalPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: TINT,
  },
  personalText: { fontSize: 15, fontWeight: '700', color: C.primary },
  benefits: { gap: 8, marginTop: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 15, fontWeight: '500', color: C.t1 },
  timeline: { marginTop: 18 },
  tlRow: { flexDirection: 'row', gap: 14 },
  tlRail: { alignItems: 'center', width: 32 },
  tlNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlNodeActive: { backgroundColor: C.primary },
  tlLine: { flex: 1, width: 2, backgroundColor: TINT, marginVertical: 2 },
  tlTitle: { fontSize: 15, fontWeight: '700', color: C.t1, marginTop: 5 },
  tlDesc: { fontSize: 13.5, lineHeight: 18, color: C.t2, marginTop: 1 },
  plans: { gap: 10, marginTop: 20 },
  plansLoading: { height: 150, alignItems: 'center', justifyContent: 'center' },
  unavailableText: { fontSize: 15, lineHeight: 21, color: C.t2, textAlign: 'center', paddingHorizontal: 16 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.bg,
  },
  planSelected: { borderColor: C.primary, borderWidth: 2, backgroundColor: 'rgba(23,123,156,0.04)' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.t3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: C.primary, backgroundColor: C.primary },
  planTitle: { fontSize: 17, fontWeight: '700', color: C.t1 },
  planDetail: { fontSize: 13, color: C.t2, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '800', color: C.t1, fontVariant: ['tabular-nums'] },
  badge: {
    position: 'absolute',
    top: -11,
    right: 14,
    backgroundColor: C.primary,
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  trustText: { fontSize: 13, color: C.t3 },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  noPaymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  noPayment: { fontSize: 15, fontWeight: '600', color: C.t1 },
  cta: {
    backgroundColor: C.primary,
    borderRadius: R.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  disclosure: { fontSize: 11.5, lineHeight: 15, color: C.t3, textAlign: 'center', marginTop: 8 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 6 },
  link: { fontSize: 12, fontWeight: '600', color: C.t2, textDecorationLine: 'underline' },
  dot: { color: C.t3 },
});
