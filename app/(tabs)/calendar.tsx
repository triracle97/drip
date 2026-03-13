import ActivityLog from '@/components/ActivityLog';
import AnimatedPressable from '@/components/AnimatedPressable';
import EditSubSheet from '@/components/EditSubSheet';
import IncomeCTA from '@/components/IncomeCTA';
import IncomeSheet from '@/components/IncomeSheet';
import MonthSummaryCard from '@/components/MonthSummaryCard';
import TrialSheet from '@/components/TrialSheet';
import UpcomingChargeCompact from '@/components/UpcomingChargeCompact';
import UpcomingChargeHero from '@/components/UpcomingChargeHero';
import { C, LAYOUT, R } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { getEventsByMonth } from '@/store/repository';
import type { SubscriptionEvent } from '@/store/repository';
import { blended, curMonth, curYear, fmt, monthName, nextChargeIn, subMo, toHrs } from '@/utils/calc';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Category } from '@/store';

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const { subs, incomes, categories, spendingHistory } = useStore();
  const rate = blended(incomes);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const subMap = useMemo(() => {
    const m: Record<string, Sub> = {};
    subs.forEach(s => { m[s.id] = s; });
    return m;
  }, [subs]);

  const [calMonth, setCalMonth] = useState(curMonth);
  const [calYear, setCalYear] = useState(curYear);
  const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [showIncome, setShowIncome] = useState(false);
  const [monthEvents, setMonthEvents] = useState<SubscriptionEvent[]>([]);

  const isCurrentMonth = calMonth === curMonth && calYear === curYear;

  // Fetch events when month changes
  useEffect(() => {
    getEventsByMonth(calMonth, calYear).then(setMonthEvents);
  }, [calMonth, calYear]);

  // Upcoming charges (current month only)
  const upcoming = useMemo(() => {
    if (!isCurrentMonth) return [];
    return subs
      .filter(s => s.active || s.isTrial)
      .map(s => ({ sub: s, daysLeft: nextChargeIn(s) }))
      .filter(({ daysLeft }) => daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subs, isCurrentMonth]);

  const heroCharge = upcoming[0] ?? null;
  const otherCharges = upcoming.slice(1);

  // Month totals
  const activeSubs = subs.filter(s => s.active && !s.isTrial);
  const totalMo = activeSubs.reduce((sum, s) => sum + subMo(s), 0);

  // Category breakdown for summary
  const catBreakdown = useMemo(() => {
    const bd: Record<string, number> = {};
    activeSubs.forEach(s => { bd[s.categoryId] = (bd[s.categoryId] || 0) + subMo(s); });
    return Object.entries(bd)
      .map(([categoryId, amount]) => ({ categoryId, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeSubs]);

  // Previous month total from spending history
  const prevMonthTotal = useMemo(() => {
    const prevM = calMonth === 0 ? 11 : calMonth - 1;
    const prevY = calMonth === 0 ? calYear - 1 : calYear;
    const snap = spendingHistory.find(s => s.month === prevM && s.year === prevY);
    return snap?.totalMonthlyCost ?? null;
  }, [spendingHistory, calMonth, calYear]);

  const prevMonthLabel = useMemo(() => {
    const prevM = calMonth === 0 ? 11 : calMonth - 1;
    const prevY = calMonth === 0 ? calYear - 1 : calYear;
    return monthName(prevM, prevY).split(' ')[0];
  }, [calMonth, calYear]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const canGoNext = !(calMonth === curMonth && calYear === curYear);

  const handleSubPress = (sub: Sub) => {
    if (sub.isTrial) setTrialSheet(sub);
    else setEditSubId(sub.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Timeline</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {incomes.length === 0 && <IncomeCTA onPress={() => setShowIncome(true)} />}

        {/* Month Navigator */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={s.monthNav}>
            <AnimatedPressable onPress={prevMonth} style={s.navBtn}>
              <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                <Path d="M10 3L5 8l5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </AnimatedPressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.monthTitle}>{monthName(calMonth, calYear)}</Text>
              <Text style={s.monthMeta}>{fmt(totalMo)} · {toHrs(totalMo, rate)}</Text>
            </View>
            <AnimatedPressable onPress={nextMonth} style={[s.navBtn, !canGoNext && { opacity: 0.3 }]}>
              <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                <Path d="M6 3l5 5-5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Upcoming Charges (current month only) */}
        {isCurrentMonth && heroCharge && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={s.sectionLabel}>NEXT UP</Text>
            <UpcomingChargeHero
              name={heroCharge.sub.name}
              icon={heroCharge.sub.icon}
              color={heroCharge.sub.color}
              cost={fmt(heroCharge.sub.cost)}
              date={`${monthName(calMonth, calYear).split(' ')[0]} ${heroCharge.sub.billDay}`}
              daysLeft={heroCharge.daysLeft}
              hoursLabel={toHrs(subMo(heroCharge.sub), rate)}
              onPress={() => handleSubPress(heroCharge.sub)}
            />
            {otherCharges.length > 0 && (
              <View style={s.compactRow}>
                {otherCharges.slice(0, 4).map(({ sub, daysLeft }) => (
                  <UpcomingChargeCompact
                    key={sub.id}
                    name={sub.name}
                    icon={sub.icon}
                    color={sub.color}
                    daysLeft={daysLeft}
                    cost={fmt(sub.cost)}
                    onPress={() => handleSubPress(sub)}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Divider between upcoming and summary */}
        {isCurrentMonth && heroCharge && (
          <View style={s.divider} />
        )}

        {/* Month Summary */}
        <Animated.View entering={FadeInDown.duration(300).delay(isCurrentMonth && heroCharge ? 200 : 100)}>
          <MonthSummaryCard
            breakdown={catBreakdown}
            catMap={catMap}
            totalMo={totalMo}
            activeCount={activeSubs.length}
            prevMonthTotal={prevMonthTotal}
            prevMonthLabel={prevMonthLabel}
          />
        </Animated.View>

        {/* Activity Log */}
        <Animated.View entering={FadeInDown.duration(300).delay(isCurrentMonth && heroCharge ? 300 : 200)} style={{ marginTop: 8 }}>
          <ActivityLog events={monthEvents} subMap={subMap} />
        </Animated.View>
      </ScrollView>

      <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />
      <EditSubSheet id={editSubId} onClose={() => setEditSubId(null)} />
      <IncomeSheet visible={showIncome} onClose={() => setShowIncome(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 16, backgroundColor: C.bg,
  },
  title: {
    fontSize: 22, fontWeight: '700', color: C.t1,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },
  compactRow: {
    flexDirection: 'row', gap: 6, marginTop: 6,
  },
  divider: {
    height: 1, backgroundColor: C.line, marginVertical: 12,
  },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: R.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18, fontWeight: '700', color: C.t1,
  },
  monthMeta: {
    fontSize: 12, color: C.t1, marginTop: 2,
  },
});
