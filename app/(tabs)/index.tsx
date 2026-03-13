import AddSubSheet from '@/components/AddSubSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import Card from '@/components/Card';
import EditSubSheet from '@/components/EditSubSheet';
import IncomeSheet from '@/components/IncomeSheet';
import SubRow from '@/components/SubRow';
import Toast from '@/components/Toast';
import TrialSheet from '@/components/TrialSheet';
import { C, LAYOUT, R, SP, TS } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { getPopularSubs, PopularSub } from '@/store/supabase';
import {
  blended,
  curDay,
  cycleDays, daysLabel,
  fmt,
  nextChargeIn,
  subMo,
  toHrs
} from '@/utils/calc';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Category } from '@/store';


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { subs, incomes, categories, reorderSubs } = useStore();
  const currency = useSettings(s => s.currency);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);
  const [viewPeriod, setViewPeriod] = useState<'mo' | 'yr'>('mo');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showIncome, setShowIncome] = useState(false);
  const addSheetRef = useRef<TrueSheet>(null);

  // ─── Sheet state ───
  const [popularSubs, setPopularSubs] = useState<PopularSub[]>([]);
  const [sheetPhase, setSheetPhase] = useState<'pick' | 'form'>('pick');
  const [sheetQuery, setSheetQuery] = useState('');
  const [sheetForm, setSheetForm] = useState({ name: '', icon: '📦', color: '#000000', cost: '', categoryId: 'cat_other' });

  useEffect(() => { getPopularSubs().then(setPopularSubs); }, []);

  const sheetFiltered = useMemo(() => {
    if (!sheetQuery.trim()) return popularSubs;
    const q = sheetQuery.toLowerCase();
    return popularSubs.filter(s => s.name.toLowerCase().includes(q));
  }, [popularSubs, sheetQuery]);

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
    const list = filterCat ? active.filter(s => s.categoryId === filterCat) : active;
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [active, filterCat]);

  const isYr = viewPeriod === 'yr';

  const handleDragEnd = useCallback(({ data }: { data: Sub[] }) => {
    // Persist the full ordering: dragged items + non-active items
    const activeIds = data.map(s => s.id);
    const otherIds = subs.filter(s => !activeIds.includes(s.id)).map(s => s.id);
    reorderSubs([...activeIds, ...otherIds]);
  }, [subs, reorderSubs]);

  const renderItem = useCallback(({ item: s_, drag, isActive: isDragging }: RenderItemParams<Sub>) => {
    const mc = subMo(s_);
    const displayCost = isYr ? mc * 12 : mc;
    const remain = nextChargeIn(s_);
    const total = cycleDays(s_);
    const urgent = remain <= 3;
    return (
      <ScaleDecorator>
        <SubRow
          name={s_.name}
          icon={s_.icon}
          color={s_.color}
          costLabel={fmt(displayCost)}
          costSub={`/${isYr ? 'year' : 'month'}`}
          renewLabel={daysLabel(remain)}
          hoursLabel={toHrs(displayCost, rate)}
          urgent={urgent}
          onPress={() => setEditSubId(s_.id)}
          onLongPress={drag}
          isDragging={isDragging}
        />
      </ScaleDecorator>
    );
  }, [isYr, rate]);

  const ListHeader = useMemo(() => (
    <>
      {/* Compact Hero Summary Card */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={s.heroCard}>
          <View style={s.heroRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Total Cost</Text>
              <Text style={s.heroStatValue}>{fmt(displayTotal)}</Text>
              <Text style={s.heroStatHint}>{active.length} active</Text>
            </View>
            <View style={s.heroDivider} />
            {incomes.length === 0 ? (
              <TouchableOpacity onPress={() => setShowIncome(true)} style={s.heroStat} activeOpacity={0.7}>
                <Text style={s.heroStatLabel}>Work Hours</Text>
                <View style={s.heroAddBtn}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={[s.heroStatHint, { color: C.green }]}>set income</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Work Hours</Text>
                <Text style={s.heroStatValue}>{toHrs(displayTotal, rate)}</Text>
                <Text style={s.heroStatHint}>to earn this</Text>
              </View>
            )}
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
      <View style={{ marginBottom: 12, marginTop: 12 }}>
        <Text style={s.subCount}>{displaySubs.length} subscriptions</Text>
        <Text style={s.dragHint}>Long press to drag and reorder</Text>
      </View>

      {/* Active trial rows */}
      {activeTrials.map((s_) => {
        const mc = subMo(s_);
        const daysLeft = s_.trialEndDay - curDay;
        const displayCost = isYr ? mc * 12 : mc;
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
    </>
  ), [displayTotal, active.length, incomes.length, rate, pctIncome, displaySubs.length, isYr, activeTrials]);

  const ListFooter = useMemo(() => (
    <>
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
              onPress={() => setEditSubId(s_.id)}
            />
          ))}
        </View>
      )}
    </>
  ), [inactive, isYr]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill="#177b9c" />
            <Circle cx="9" cy="15" r="2.5" fill="#3a9cbc" />
          </Svg>
          <Text style={s.wordmark}>Drip</Text>
        </View>
        <AnimatedPressable onPress={() => addSheetRef.current?.present()} style={s.addBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </AnimatedPressable>
      </View>

      <DraggableFlatList
        data={displaySubs}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 16 }}
        showsVerticalScrollIndicator={false}
        activationDistance={0}
      />

      <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />

      <EditSubSheet id={editSubId} onClose={() => setEditSubId(null)} />

      <AddSubSheet ref={addSheetRef} />

      <Toast message={toast} />
      <IncomeSheet visible={showIncome} onClose={() => setShowIncome(false)} />
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
  heroCard: {
    marginTop: SP[1],
    paddingVertical: SP[3],
    paddingHorizontal: SP[3],
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
    fontSize: TS.micro.fontSize, fontWeight: '600', color: C.t2,
    letterSpacing: TS.micro.letterSpacing, textTransform: 'uppercase',
    marginBottom: SP[1],
  },
  heroStatValue: {
    fontSize: TS.subtitle.fontSize, fontWeight: '700', color: C.t1,
    letterSpacing: TS.subtitle.letterSpacing,
  },
  heroStatHint: {
    fontSize: TS.micro.fontSize, fontWeight: '400', color: C.t3, marginTop: 2,
  },
  heroAddBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 2,
  },
  heroDivider: {
    width: 1, height: SP[5], backgroundColor: C.line,
  },
  sectionCap: {
    fontSize: 11, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subCount: {
    fontSize: 15, fontWeight: '700', color: C.t1,
  },
  dragHint: {
    fontSize: 11, fontWeight: '400', color: C.t3, marginTop: 2,
  },
});
