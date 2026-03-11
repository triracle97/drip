import AddSubSheet from '@/components/AddSubSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import Card from '@/components/Card';
import SubRow from '@/components/SubRow';
import Toast from '@/components/Toast';
import TrialSheet from '@/components/TrialSheet';
import { C, LAYOUT, R, SHADOW } from '@/constants/design';
import { Sub, useStore } from '@/store';
import {
  blended,
  curDay,
  cycleDays, daysLabel,
  fmt,
  nextChargeIn,
  subMo,
  timeTier,
  toHrs,
} from '@/utils/calc';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Category } from '@/store';

const SORT_LABELS: Record<string, string> = {
  cost: 'Highest cost',
  costLow: 'Lowest cost',
  renewing: 'Renewing soon',
  name: 'Name A-Z',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { subs, incomes, categories } = useStore();

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);
  const [viewPeriod, setViewPeriod] = useState<'mo' | 'yr'>('mo');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('cost');
  const [sortOpen, setSortOpen] = useState(false);
  const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const rate = blended(incomes);
  const activeTrials = subs.filter(s => s.isTrial && s.trialDecision === 'pending' && s.trialEndDay > curDay);
  const expiredTrials = subs.filter(s => s.isTrial && s.trialEndDay <= curDay);
  const active = [...subs.filter(s => s.active && !s.isTrial), ...expiredTrials];
  const inactive = subs.filter(s => !s.active && !s.isTrial);
  const totalMo = active.reduce((sum, s) => sum + subMo(s), 0);
  const displayTotal = viewPeriod === 'yr' ? totalMo * 12 : totalMo;
  const totalIncomeMo = incomes.reduce((sum, i) => {
    return sum + (i.isHourly ? i.amount * (i.hoursPerWeek || 10) * 4.33 : i.amount / 12);
  }, 0);
  const pctIncome = totalIncomeMo > 0 ? (totalMo / totalIncomeMo) * 100 : 0;

  const catBreakdown = useMemo(() => {
    const bd: Record<string, number> = {};
    active.forEach(s => { bd[s.categoryId] = (bd[s.categoryId] || 0) + subMo(s); });
    return Object.entries(bd).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const displaySubs = useMemo(() => {
    let list = filterCat ? active.filter(s => s.categoryId === filterCat) : active;
    if (sortBy === 'cost') list = [...list].sort((a, b) => subMo(b) - subMo(a));
    if (sortBy === 'costLow') list = [...list].sort((a, b) => subMo(a) - subMo(b));
    if (sortBy === 'renewing') list = [...list].sort((a, b) => nextChargeIn(a) - nextChargeIn(b));
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [active, filterCat, sortBy]);

  const isYr = viewPeriod === 'yr';

  // Scroll-driven hero animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const heroAnimStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 120], [0, -40], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [0, 120], [1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const pillsAnimStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 120], [0, -30], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill={C.black} stroke={C.black} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={s.wordmark}>Drip</Text>
        </View>
        <AnimatedPressable onPress={() => setAddSheetOpen(true)} style={s.addBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </AnimatedPressable>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 16 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Compact Hero Summary Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={heroAnimStyle}>
          <Card style={s.heroCard}>
            <View style={s.heroRow}>
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Total Cost</Text>
                <Text style={s.heroStatValue}>{fmt(displayTotal)}</Text>
                <Text style={s.heroStatHint}>{active.length} active</Text>
              </View>
              <View style={s.heroDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Work Hours</Text>
                <Text style={s.heroStatValue}>{toHrs(displayTotal, rate)}</Text>
                <Text style={s.heroStatHint}>to earn this</Text>
              </View>
              <View style={s.heroDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>% Income</Text>
                <Text style={s.heroStatValue}>{pctIncome.toFixed(1)}%</Text>
                <Text style={s.heroStatHint}>of monthly</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Subscription List Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 12 }}>
          <Text style={s.subCount}>{displaySubs.length} subscriptions</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setSortOpen(o => !o)}
              style={[s.sortBtn, sortOpen && { backgroundColor: C.bgSub }]}
              activeOpacity={0.75}
            >
              <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
                <Path d="M5 3L5 13M5 3L2.5 5.5M5 3L7.5 5.5M11 13L11 3M11 13L8.5 10.5M11 13L13.5 10.5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={s.sortLabel}>{SORT_LABELS[sortBy]}</Text>
            </TouchableOpacity>
            {sortOpen && (
              <>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSortOpen(false)} />
                <View style={s.sortDropdown}>
                  {Object.entries(SORT_LABELS).map(([k, l]) => (
                    <TouchableOpacity
                      key={k}
                      onPress={() => { setSortBy(k); setSortOpen(false); }}
                      style={[s.sortItem, sortBy === k && { backgroundColor: C.bgSub }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.sortItemTxt, { color: sortBy === k ? C.t1 : C.t2, fontWeight: sortBy === k ? '600' : '500' }]}>{l}</Text>
                      {sortBy === k && <Text style={{ color: C.t1, fontSize: 12 }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Active trial rows */}
        {activeTrials.map((s_) => {
          const mc = subMo(s_);
          const daysLeft = s_.trialEndDay - curDay;
          const displayCost = isYr ? mc * 12 : mc;
          const totalDays = 14;
          const pct = Math.min(1, Math.max(0, (totalDays - daysLeft) / totalDays));
          return (
            <Animated.View key={s_.id} entering={FadeInDown.duration(300).delay(50)}>
              <SubRow
                name={s_.name}
                icon={s_.icon}
                color={s_.color}
                costLabel={fmt(displayCost)}
                variant="trial"
                trialDaysLeft={daysLeft}
                trialCostLabel={`Then ${fmt(displayCost)}/${isYr ? 'year' : 'month'}`}
                onPress={() => setTrialSheet(s_)}
              />
            </Animated.View>
          );
        })}

        {/* Active sub rows */}
        {displaySubs.map((s_, idx) => {
          const mc = subMo(s_);
          const displayCost = isYr ? mc * 12 : mc;
          const remain = nextChargeIn(s_);
          const total = cycleDays(s_);
          const pct = Math.min(1, Math.max(0, (total - remain) / total));
          const urgent = remain <= 3;
          const tier = timeTier(displayCost, rate);
          return (
            <Animated.View key={s_.id} entering={FadeInDown.duration(300).delay(idx * 30)}>
              <SubRow
                name={s_.name}
                icon={s_.icon}
                color={s_.color}
                costLabel={fmt(displayCost)}
                costSub={`/${isYr ? 'year' : 'month'}`}
                renewLabel={daysLabel(remain)}
                hoursLabel={toHrs(displayCost, rate)}
                urgent={urgent}
                onPress={() => router.push({ pathname: '/edit', params: { id: s_.id } })}
              />
            </Animated.View>
          );
        })}

        {/* Inactive */}
        {inactive.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.sectionCap, { marginBottom: 8 }]}>Cancelled</Text>
            {inactive.map(s_ => (
              <SubRow
                key={s_.id}
                name={s_.name}
                icon={s_.icon}
                color={s_.color}
                costLabel={fmt(s_.cost)}
                variant="inactive"
                onPress={() => router.push({ pathname: '/edit', params: { id: s_.id } })}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />
      <AddSubSheet visible={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenHPad,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 50,
  },
  wordmark: {
    fontSize: 18, fontWeight: '800', color: C.t1,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: R.pill,
    backgroundColor: C.black,
    alignItems: 'center', justifyContent: 'center',
  },
  // Compact hero card
  heroCard: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10, fontWeight: '700', color: C.t2, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 18, fontWeight: '800', color: C.t1, letterSpacing: -0.5,
  },
  heroStatHint: {
    fontSize: 9, fontWeight: '500', color: C.t3, marginTop: 2,
  },
  heroDivider: {
    width: 1, height: 28, backgroundColor: C.line,
  },
  sectionCap: {
    fontSize: 11, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subCount: {
    fontSize: 15, fontWeight: '700', color: C.t1,
  },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: R.pill,
  },
  sortLabel: {
    fontSize: 12, fontWeight: '500', color: C.t3,
  },
  sortDropdown: {
    position: 'absolute', top: 44, right: 0, zIndex: 20, minWidth: 170,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
    borderRadius: R.md, padding: 4,
    ...SHADOW.cardHover,
  },
  sortItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: R.pill,
  },
  sortItemTxt: {
    fontSize: 12,
  },
});
