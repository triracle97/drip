/**
 * First-run flow (full screen, shown until `hasOnboarded`):
 *   0 welcome → 1 pick your subscriptions → 2 income → 3 reveal ("you work Xh a month")
 *   → 4 reminders permission → (root layout then shows the paywall)
 *
 * Nothing is written to the store until the last step, so going back and forth
 * never creates duplicates.
 */
import CurrencySheet from '@/components/CurrencySheet';
import LogoTile from '@/components/onboarding/LogoTile';
import { getCurrency } from '@/constants/currencies';
import { C, R } from '@/constants/design';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { localPrice } from '@/lib/fx';
import { incomeFromMonthly, revealStats } from '@/lib/onboarding';
import { Sub, useStore } from '@/store';
import { setOnboardingAttributes } from '@/store/purchases';
import { getPopularSubs, PopularSub } from '@/store/supabase';
import { useSettings } from '@/store/settings';
import { fmt, moEq, toHrs, toLocalISO } from '@/utils/calc';
import { requestPermissions } from '@/utils/notifications';
import * as Haptics from 'expo-haptics';
import { ArrowDown, Check, ChevronDown, ChevronLeft, Lock } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const STEPS = ['welcome', 'pick', 'income', 'reveal', 'reminders'] as const;
type Step = 0 | 1 | 2 | 3 | 4;

/** Utilities (rent, power, …) are bills, not subscriptions people forget. */
const PICKABLE_CATEGORIES = new Set(['cat_entertainment', 'cat_productivity', 'cat_health', 'cat_education', 'cat_finance']);
const MAX_TILES = 18;

export interface Picked {
  id: string;
  name: string;
  icon: string;
  color: string;
  categoryId: string;
  cost: number;
  cycle: string;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { addIncome, addSub, subs } = useStore();
  const currency = useSettings((s) => s.currency);
  const setHasOnboarded = useSettings((s) => s.setHasOnboarded);
  const setNotificationsEnabled = useSettings((s) => s.setNotificationsEnabled);

  const [step, setStep] = useState<Step>(0);
  const [popular, setPopular] = useState<PopularSub[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [income, setIncome] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    track(AnalyticsEvents.ONBOARDING_STARTED);
    track(AnalyticsEvents.ONBOARDING_STEP_VIEWED, { step: 0, step_name: STEPS[0] });
    let alive = true;
    getPopularSubs()
      .then((list) => {
        if (!alive) return;
        setPopular(list.filter((p) => PICKABLE_CATEGORIES.has(p.category_id)).slice(0, MAX_TILES));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Prices follow the currency chosen on the income step.
  const picked: Picked[] = useMemo(
    () =>
      selected
        .map((id) => popular.find((p) => p.id === id))
        .filter((p): p is PopularSub => !!p)
        .map((p) => ({
          id: p.id,
          name: p.name,
          icon: p.icon,
          color: p.color,
          categoryId: p.category_id,
          cost: localPrice(p.default_cost, currency),
          cycle: p.default_cycle || 'monthly',
        })),
    [selected, popular, currency],
  );

  const monthlyIncome = parseFloat(income) || 0;
  const stats = useMemo(() => revealStats(picked, monthlyIncome), [picked, monthlyIncome]);

  const go = (next: Step) => {
    setStep(next);
    track(AnalyticsEvents.ONBOARDING_STEP_VIEWED, { step: next, step_name: STEPS[next] });
  };

  const back = () => {
    if (step === 0) return;
    // The reveal is skipped when nothing was picked, so skip it going back too.
    const prev = (step === 4 && picked.length === 0 ? 2 : step - 1) as Step;
    setStep(prev);
  };

  const afterIncome = () => go(picked.length > 0 ? 3 : 4);

  const finish = async (wantsReminders: boolean) => {
    if (finishing) return;
    setFinishing(true);
    let granted = false;
    if (wantsReminders) {
      granted = await requestPermissions().catch(() => false);
      if (granted) setNotificationsEnabled(true);
    }
    if (monthlyIncome > 0) {
      addIncome(incomeFromMonthly(monthlyIncome));
      track(AnalyticsEvents.ONBOARDING_INCOME_SUBMITTED, { monthly_income: monthlyIncome, currency });
    } else {
      track(AnalyticsEvents.ONBOARDING_INCOME_SKIPPED);
    }
    const today = toLocalISO(new Date());
    const startOrder = subs.reduce((m, s) => Math.min(m, s.sortOrder ?? 0), 0) - picked.length;
    picked.forEach((p, i) => {
      const sub: Sub = {
        id: `s${Date.now()}_${i}`,
        name: p.name,
        icon: p.icon,
        cost: p.cost,
        cycle: p.cycle,
        categoryId: p.categoryId,
        active: true,
        billDay: new Date().getDate(),
        startDate: today,
        isTrial: false,
        trialEndDay: '',
        trialDecision: 'none',
        color: p.color,
        reminderDays: granted ? 1 : null,
        sortOrder: startOrder + i,
      };
      addSub(sub);
    });
    setOnboardingAttributes({
      subsPicked: picked.length,
      hasIncome: monthlyIncome > 0,
      remindersOn: granted,
      currency,
      language: useSettings.getState().language,
    });
    track(AnalyticsEvents.ONBOARDING_COMPLETED, {
      subs_picked: picked.length,
      has_income: monthlyIncome > 0,
      reminders: granted,
      hours_per_month: Math.round(stats.hoursPerMonth * 10) / 10,
    });
    setHasOnboarded(true);
  };

  const showProgress = step !== 3;

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={back}
          hitSlop={12}
          style={[s.backBtn, step === 0 && { opacity: 0 }]}
          disabled={step === 0}
          accessibilityLabel={t('onb.back')}
        >
          <ChevronLeft size={24} color={C.t1} strokeWidth={2.2} />
        </TouchableOpacity>
        {showProgress && <Progress step={step} />}
        <View style={s.backBtn} />
      </View>

      <View style={{ flex: 1 }}>
        {step === 0 && <StepWelcome onNext={() => go(1)} />}
        {step === 1 && (
          <StepPick
            popular={popular}
            selected={selected}
            onToggle={(id) =>
              setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
            }
            monthlyCost={stats.monthlyCost}
            onNext={() => go(2)}
          />
        )}
        {step === 2 && (
          <StepIncome
            income={income}
            setIncome={setIncome}
            onCurrency={() => setCurrencyOpen(true)}
            onNext={afterIncome}
            onSkip={() => {
              setIncome('');
              afterIncome();
            }}
          />
        )}
        {step === 3 && <StepReveal picked={picked} stats={stats} onNext={() => go(4)} />}
        {step === 4 && <StepReminders picked={picked} rate={stats.rate} busy={finishing} onFinish={finish} />}
      </View>

      <View style={{ height: insets.bottom }} />
      <CurrencySheet visible={currencyOpen} onClose={() => setCurrencyOpen(false)} />
    </KeyboardAvoidingView>
  );
}

// ─── Progress ───────────────────────────────────────────

function Segment({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? C.primary : 'rgba(0,0,0,0.08)', { duration: 250 }),
  }));
  return <Animated.View style={[s.segment, style]} />;
}

function Progress({ step }: { step: number }) {
  return (
    <View style={s.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}>
      {STEPS.map((_, i) => (
        <Segment key={i} active={i <= step} />
      ))}
    </View>
  );
}

// ─── Shared ─────────────────────────────────────────────

function Cta({
  label,
  onPress,
  variant = 'teal',
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'teal' | 'black';
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      testID={testID}
      style={[s.cta, { backgroundColor: variant === 'black' ? C.black : C.primary }, disabled && s.ctaDisabled]}
    >
      <Text style={s.ctaText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TextLink({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} style={s.textLink} testID={testID}>
      <Text style={s.textLinkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── 0 · Welcome ────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={s.step}>
      <View style={s.welcomeHero}>
        <Animated.View entering={FadeInDown.duration(400)} style={s.demoCard}>
          <LogoTile icon="svg:netflix-fill" color="#E60000" size={52} />
          <Text style={s.demoName}>Netflix</Text>
          <Text style={s.demoPrice}>{t('onb.welcome.demoPrice')}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.duration(300).delay(350)}>
          <ArrowDown size={28} color={C.t3} strokeWidth={1.8} style={{ marginVertical: 14 }} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.duration(400).delay(550)} style={s.heroNumber}>
          {t('onb.welcome.demoHours')}
        </Animated.Text>
        <Animated.Text entering={FadeIn.duration(300).delay(700)} style={s.heroCaption}>
          {t('onb.welcome.ofYourWork')}
        </Animated.Text>
      </View>
      <Text style={s.headlineCenter}>{t('onb.welcome.title')}</Text>
      <Text style={s.subCenter}>{t('onb.welcome.sub')}</Text>
      <View style={s.bottom}>
        <Cta label={t('onb.welcome.cta')} onPress={onNext} variant="black" testID="onb-start" />
      </View>
    </View>
  );
}

// ─── 1 · Pick ───────────────────────────────────────────

function StepPick({
  popular,
  selected,
  onToggle,
  monthlyCost,
  onNext,
}: {
  popular: PopularSub[];
  selected: string[];
  onToggle: (id: string) => void;
  monthlyCost: number;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  // 3 columns: screen minus 24pt side padding, minus two 10pt gaps.
  const tileW = Math.floor((Math.min(width, 520) - 48 - 20) / 3);
  return (
    <View style={s.step}>
      <Text style={s.headline}>{t('onb.pick.title')}</Text>
      <Text style={s.sub}>{t('onb.pick.sub')}</Text>
      <ScrollView style={{ flex: 1, marginTop: 16 }} contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {popular.map((p) => {
          const on = selected.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[s.pickTile, { width: tileW, height: tileW }, on && s.pickTileOn]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onToggle(p.id);
              }}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={p.name}
              testID={`pick-${p.name}`}
            >
              <LogoTile icon={p.icon} color={p.color} size={48} />
              <Text style={s.pickName} numberOfLines={1}>{p.name}</Text>
              {on && (
                <View style={s.pickCheck}>
                  <Check size={12} color="#fff" strokeWidth={3.5} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={s.bottom}>
        <Text style={s.pickSummary}>
          {selected.length > 0
            ? t('onb.pick.summary', { count: selected.length, cost: fmt(monthlyCost) })
            : t('onb.pick.none')}
        </Text>
        <Cta
          label={selected.length > 0 ? t('onb.continue') : t('onb.skip')}
          onPress={onNext}
          testID="onb-pick-next"
        />
      </View>
    </View>
  );
}

// ─── 2 · Income ─────────────────────────────────────────

function StepIncome({
  income,
  setIncome,
  onCurrency,
  onNext,
  onSkip,
}: {
  income: string;
  setIncome: (v: string) => void;
  onCurrency: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const currency = useSettings((s) => s.currency);
  const cur = getCurrency(currency);
  const { formatNumber, parseFormatted } = useNumberFormat();
  const value = parseFloat(income) || 0;
  const rate = revealStats([], value).rate;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.step}>
      <Text style={s.headline}>{t('onb.income.title')}</Text>
      <Text style={s.sub}>{t('onb.income.sub')}</Text>

      <View style={s.incomeRow}>
        <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1} style={s.incomeInputWrap}>
          <Text style={s.incomeSymbol}>{cur.symbol}</Text>
          <TextInput
            ref={inputRef}
            style={s.incomeInput}
            value={formatNumber(income)}
            onChangeText={(v) => setIncome(parseFormatted(v))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={C.t3}
            maxLength={14}
            testID="onb-income-input"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCurrency} style={s.currencyChip} activeOpacity={0.8}>
          <Text style={s.currencyChipText}>{currency}</Text>
          <ChevronDown size={16} color={C.t2} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', minHeight: 40 }}>
        {rate > 0 && (
          <Animated.View entering={FadeIn.duration(200)} style={s.rateChip}>
            <Text style={s.rateChipText}>{t('onb.income.perHour', { rate: fmt(rate) })}</Text>
          </Animated.View>
        )}
      </View>

      <View style={s.trustRow}>
        <Lock size={13} color={C.t3} strokeWidth={2.4} />
        <Text style={s.trustText}>{t('onb.income.trust')}</Text>
      </View>

      <View style={[s.bottom, { marginTop: 'auto' }]}>
        <Cta label={t('onb.continue')} onPress={onNext} disabled={!(value > 0)} testID="onb-income-next" />
        <TextLink label={t('onb.skipForNow')} onPress={onSkip} testID="onb-income-skip" />
      </View>
    </View>
  );
}

// ─── 3 · Reveal ─────────────────────────────────────────

/** Ease-out count-up from 0 → target over `ms`. */
function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Uses the same rounded hours as the sentence it completes ("40 hours — a full work week"). */
export function yearEquivalent(t: (k: string, o?: any) => string, hoursPerYear: number): string {
  const hours = Math.round(hoursPerYear);
  if (hours >= 40) {
    return t('onb.reveal.workWeeks', { count: Math.floor(hours / 40) });
  }
  return t('onb.reveal.workDays', { count: Math.max(1, Math.round(hours / 8)) });
}

function StepReveal({
  picked,
  stats,
  onNext,
}: {
  picked: Picked[];
  stats: ReturnType<typeof revealStats>;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const hasRate = stats.rate > 0;
  const animated = useCountUp(stats.monthlyCost);

  useEffect(() => {
    const timer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(
    () => [...picked].sort((a, b) => moEq(b.cost, b.cycle) - moEq(a.cost, a.cycle)),
    [picked],
  );

  return (
    <View style={s.step}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={s.revealCaption}>{hasRate ? t('onb.reveal.everyMonthWork') : t('onb.reveal.everyMonthSpend')}</Text>
        <Text style={s.revealNumber} accessibilityLabel={hasRate ? toHrs(stats.monthlyCost, stats.rate) : fmt(stats.monthlyCost)}>
          {hasRate ? toHrs(animated, stats.rate) : fmt(animated)}
        </Text>
        <Text style={s.revealSub}>
          {hasRate
            ? t('onb.reveal.toPayFor', { count: stats.count })
            : t('onb.reveal.onSubs', { count: stats.count })}
        </Text>

        <Animated.View entering={FadeInDown.duration(400).delay(900)} style={s.revealCard}>
          <Text style={s.revealCardText}>
            {hasRate
              ? t('onb.reveal.yearHours', {
                  hours: Math.round(stats.hoursPerYear),
                  equiv: yearEquivalent(t, stats.hoursPerYear),
                })
              : t('onb.reveal.yearCost', { cost: fmt(stats.monthlyCost * 12) })}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(1100)} style={s.listCard}>
          {rows.map((p, i) => {
            const mo = moEq(p.cost, p.cycle);
            return (
              <View key={p.id} style={[s.listRow, i > 0 && s.listRowBorder]}>
                <LogoTile icon={p.icon} color={p.color} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={s.listName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.listPrice}>{t('onb.perMonth', { price: fmt(mo) })}</Text>
                </View>
                <Text style={s.listHours}>{hasRate ? toHrs(mo, stats.rate) : fmt(mo)}</Text>
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
      <View style={s.bottom}>
        <Cta label={t('onb.reveal.cta')} onPress={onNext} variant="black" testID="onb-reveal-next" />
      </View>
    </View>
  );
}

// ─── 4 · Reminders ──────────────────────────────────────

function StepReminders({
  picked,
  rate,
  busy,
  onFinish,
}: {
  picked: Picked[];
  rate: number;
  busy: boolean;
  onFinish: (wantsReminders: boolean) => void;
}) {
  const { t } = useTranslation();
  // Preview uses the user's biggest pick when there is one.
  const sample = useMemo(() => {
    const top = [...picked].sort((a, b) => b.cost - a.cost)[0];
    return top ? { name: top.name, cost: top.cost } : null;
  }, [picked]);

  const body = sample
    ? rate > 0
      ? t('onb.reminders.previewHours', { name: sample.name, cost: fmt(sample.cost), hours: toHrs(sample.cost, rate) })
      : t('onb.reminders.preview', { name: sample.name, cost: fmt(sample.cost) })
    : t('onb.reminders.previewDemo');

  return (
    <View style={s.step}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View entering={FadeInDown.duration(450)} style={s.notif}>
          <View style={s.notifIcon}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill={C.primary} />
              <Circle cx="9" cy="15" r="2.5" fill={C.primarySub} />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.notifApp}>Drip</Text>
              <Text style={s.notifTime}>{t('onb.reminders.now')}</Text>
            </View>
            <Text style={s.notifBody}>{body}</Text>
          </View>
        </Animated.View>
        <Text style={[s.headlineCenter, { marginTop: 48 }]}>{t('onb.reminders.title')}</Text>
        <Text style={s.subCenter}>{t('onb.reminders.sub')}</Text>
      </View>
      <View style={s.bottom}>
        <Cta label={t('onb.continue')} onPress={() => onFinish(true)} disabled={busy} testID="onb-reminders-yes" />
        <TextLink label={t('onb.notNow')} onPress={() => onFinish(false)} testID="onb-reminders-no" />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  step: { flex: 1, paddingHorizontal: 24 },
  bottom: { paddingTop: 12, paddingBottom: 8, gap: 4 },
  cta: { height: 56, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  textLink: { alignSelf: 'center', paddingVertical: 12 },
  textLinkLabel: { fontSize: 15, fontWeight: '600', color: C.t2 },

  headline: { fontSize: 28, fontWeight: '800', color: C.t1, letterSpacing: -0.6, marginTop: 16 },
  sub: { fontSize: 16, lineHeight: 22, color: C.t2, marginTop: 8 },
  headlineCenter: { fontSize: 30, fontWeight: '800', color: C.t1, letterSpacing: -0.6, textAlign: 'center' },
  subCenter: { fontSize: 16, lineHeight: 23, color: C.t2, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },

  // welcome
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  demoName: { flex: 1, fontSize: 18, fontWeight: '700', color: C.t1 },
  demoPrice: { fontSize: 18, fontWeight: '700', color: C.t1, fontVariant: ['tabular-nums'] },
  heroNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  heroCaption: { fontSize: 18, color: C.t2, marginTop: -2 },

  // pick
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 12 },
  pickTile: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
    backgroundColor: C.bg,
  },
  pickTileOn: { borderColor: C.primary, borderWidth: 2, backgroundColor: 'rgba(23,123,156,0.06)' },
  pickName: { fontSize: 13, fontWeight: '600', color: C.t1 },
  pickCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickSummary: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: C.t1, marginBottom: 8 },

  // income
  incomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 12 },
  incomeInputWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  incomeSymbol: { fontSize: 44, fontWeight: '800', color: C.t1, marginRight: 6 },
  incomeInput: {
    fontSize: 52,
    fontWeight: '800',
    color: C.t1,
    letterSpacing: -1.5,
    minWidth: 60,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
  },
  currencyChipText: { fontSize: 15, fontWeight: '600', color: C.t1 },
  rateChip: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: 'rgba(23,123,156,0.08)',
  },
  rateChipText: { fontSize: 16, fontWeight: '700', color: C.primary },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  trustText: { fontSize: 13, color: C.t3 },

  // reveal
  revealCaption: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: C.t2,
  },
  revealNumber: {
    textAlign: 'center',
    fontSize: 68,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -2.2,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  revealSub: { textAlign: 'center', fontSize: 18, color: C.t2 },
  revealCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(23,123,156,0.08)',
  },
  revealCardText: { fontSize: 16, lineHeight: 22, color: C.t1, textAlign: 'center', fontWeight: '500' },
  listCard: { marginTop: 16, borderRadius: 20, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  listRowBorder: { borderTopWidth: 1, borderTopColor: C.line },
  listName: { fontSize: 16, fontWeight: '700', color: C.t1 },
  listPrice: { fontSize: 13, color: C.t2, marginTop: 1 },
  listHours: { fontSize: 17, fontWeight: '700', color: C.t1, fontVariant: ['tabular-nums'] },

  // reminders
  notif: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifApp: { fontSize: 15, fontWeight: '700', color: C.t1 },
  notifTime: { fontSize: 13, color: C.t3 },
  notifBody: { fontSize: 15, lineHeight: 20, color: C.t1, marginTop: 2 },
});
