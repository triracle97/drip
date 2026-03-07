import Toast from '@/components/Toast';
import TrialSheet from '@/components/TrialSheet';
import { C, LAYOUT, R, SP } from '@/constants/design';
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const CATS: Record<string, { label: string; color: string; icon: string }> = {
  entertainment: { label: 'Entertainment', color: '#FF3B30', icon: '🎭' },
  productivity: { label: 'Productivity', color: '#5B8DEF', icon: '⚡' },
  health: { label: 'Health', color: '#4ECB71', icon: '💚' },
  finance: { label: 'Finance', color: '#F5C542', icon: '💰' },
  education: { label: 'Education', color: '#B07FE0', icon: '📚' },
  other: { label: 'Other', color: '#8E8E93', icon: '📦' },
};

const SORT_LABELS: Record<string, string> = {
  cost: 'Highest cost',
  costLow: 'Lowest cost',
  renewing: 'Renewing soon',
  name: 'Name A–Z',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { subs, incomes } = useStore();
  const [viewPeriod, setViewPeriod] = useState<'mo' | 'yr'>('mo');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('cost');
  const [sortOpen, setSortOpen] = useState(false);
  const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rate = blended(incomes);
  const activeTrials = subs.filter(s => s.isTrial && s.trialDecision === 'pending' && s.trialEndDay > curDay);
  const expiredTrials = subs.filter(s => s.isTrial && s.trialEndDay <= curDay);
  const active = [...subs.filter(s => s.active && !s.isTrial), ...expiredTrials];
  const inactive = subs.filter(s => !s.active && !s.isTrial);
  const totalMo = active.reduce((sum, s) => sum + subMo(s), 0);
  const displayTotal = viewPeriod === 'yr' ? totalMo * 12 : totalMo;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const bd: Record<string, number> = {};
    active.forEach(s => { bd[s.category] = (bd[s.category] || 0) + subMo(s); });
    return Object.entries(bd).sort((a, b) => b[1] - a[1]);
  }, [active]);

  // Filtered + sorted subs
  const displaySubs = useMemo(() => {
    let list = filterCat ? active.filter(s => s.category === filterCat) : active;
    if (sortBy === 'cost') list = [...list].sort((a, b) => subMo(b) - subMo(a));
    if (sortBy === 'costLow') list = [...list].sort((a, b) => subMo(a) - subMo(b));
    if (sortBy === 'renewing') list = [...list].sort((a, b) => nextChargeIn(a) - nextChargeIn(b));
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [active, filterCat, sortBy]);

  const isYr = viewPeriod === 'yr';

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
        <TouchableOpacity onPress={() => router.push('/add')} style={s.addBtn} activeOpacity={0.75}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>You work</Text>
          <Text style={s.heroValue}>{toHrs(displayTotal, rate)}</Text>
          <Text style={s.heroSub}>every {isYr ? 'year' : 'month'} for subscriptions</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: SP[5] }}>
            <Text style={s.totalDollar}>{fmt(displayTotal)}</Text>
            <View style={s.segPill}>
              {(['mo', 'yr'] as const).map(k => (
                <TouchableOpacity
                  key={k}
                  onPress={() => setViewPeriod(k)}
                  style={[s.seg, viewPeriod === k && s.segActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[s.segTxt, viewPeriod === k && s.segTxtActive]}>
                    {k === 'mo' ? 'Month' : 'Year'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── CATEGORY BAR ── */}
        {catBreakdown.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            {/* Stacked bar */}
            <View style={s.catBar}>
              {catBreakdown.map(([cat, amt]) => (
                <View
                  key={cat}
                  style={{ width: `${(amt / totalMo) * 100}%`, backgroundColor: CATS[cat]?.color ?? '#8E8E93', height: '100%' }}
                />
              ))}
            </View>
            {/* Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
                {catBreakdown.map(([cat, amt]) => {
                  const sel = filterCat === cat;
                  const cc = CATS[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFilterCat(sel ? null : cat)}
                      style={[s.catPill, {
                        backgroundColor: sel ? `${cc?.color}22` : 'rgba(0,0,0,0.04)',
                        borderColor: sel ? `${cc?.color}66` : 'rgba(0,0,0,0.04)',
                      }]}
                      activeOpacity={0.75}
                    >
                      <View style={[s.catDot, { backgroundColor: cc?.color }]} />
                      <Text style={[s.catPillLabel, { color: sel ? cc?.color : C.t2 }]}>{cc?.label}</Text>
                      <Text style={[s.catPillAmt, { color: sel ? `${cc?.color}AA` : C.t3 }]}>{fmt(amt)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── TRIALS ── */}
        {activeTrials.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={s.sectionCap}>Active Trials</Text>
              <View style={s.trialBadge}>
                <Text style={s.trialBadgeTxt}>{activeTrials.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                {activeTrials.map(t => {
                  const daysLeft = t.trialEndDay - curDay;
                  const urgency = daysLeft <= 5 ? C.red : C.t2;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setTrialSheet(t)}
                      style={[s.trialCard, { borderColor: `${urgency}33` }]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <View style={[s.trialIcon, { backgroundColor: t.color }]}>
                          <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                        </View>
                        <Text style={s.trialName}>{t.name}</Text>
                      </View>
                      <Text style={[s.trialDays, { color: urgency }]}>
                        {daysLeft <= 1 ? 'Last day!' : `${daysLeft} days left`}
                      </Text>
                      <Text style={s.trialCost}>Then {toHrs(subMo(t), rate)}/month</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── SUBSCRIPTION LIST ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={s.subCount}>{displaySubs.length + activeTrials.length} subscriptions</Text>
          {/* Sort */}
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
        {activeTrials.map((s_, i) => {
          const mc = subMo(s_);
          const daysLeft = s_.trialEndDay - curDay;
          const displayCost = isYr ? mc * 12 : mc;
          const totalDays = 14;
          const pct = Math.min(1, Math.max(0, (totalDays - daysLeft) / totalDays));
          return (
            <TouchableOpacity
              key={s_.id}
              onPress={() => setTrialSheet(s_)}
              style={ss.trialRow}
              activeOpacity={0.8}
            >
              <View style={[ss.iconCircle, { backgroundColor: s_.color }]}>
                <Text style={{ fontSize: 18 }}>{s_.icon}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={ss.rowName}>{s_.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.red }}>{daysLeft}d left</Text>
                </View>
                <View style={ss.progressTrack}>
                  <View style={[ss.progressFill, { width: `${pct * 100}%`, backgroundColor: C.red }]} />
                </View>
                <Text style={ss.rowMeta}>Then {fmt(displayCost)}/{isYr ? 'year' : 'month'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Active sub rows */}
        {displaySubs.map(s_ => {
          const mc = subMo(s_);
          const displayCost = isYr ? mc * 12 : mc;
          const remain = nextChargeIn(s_);
          const total = cycleDays(s_);
          const pct = Math.min(1, Math.max(0, (total - remain) / total));
          const urgent = remain <= 3;
          const tier = timeTier(displayCost, rate);
          return (
            <TouchableOpacity
              key={s_.id}
              onPress={() => router.push({ pathname: '/edit', params: { id: s_.id } })}
              style={ss.row}
              activeOpacity={0.8}
            >
              <View style={[ss.iconCircle, { backgroundColor: s_.color }]}>
                <Text style={{ fontSize: 18 }}>{s_.icon}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={ss.rowName}>{s_.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={ss.rowCost}>{fmt(displayCost)}</Text>
                    <Text style={ss.rowCostSub}>/{isYr ? 'year' : 'month'}</Text>
                  </View>
                </View>
                <View style={ss.progressTrack}>
                  <View style={[ss.progressFill, { width: `${pct * 100}%`, backgroundColor: urgent ? C.red : s_.color, opacity: 0.7 }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={[ss.rowRenew, { color: urgent ? C.red : 'rgba(0,0,0,0.24)' }]}>{daysLabel(remain)}</Text>
                  <Text style={[ss.rowHours, { color: tier.color }]}>{toHrs(displayCost, rate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Inactive */}
        {inactive.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.sectionCap, { marginBottom: 8 }]}>Cancelled</Text>
            {inactive.map(s_ => (
              <TouchableOpacity
                key={s_.id}
                onPress={() => router.push({ pathname: '/edit', params: { id: s_.id } })}
                style={[ss.row, { opacity: 0.4 }]}
                activeOpacity={0.7}
              >
                <View style={[ss.iconCircle, { backgroundColor: `${s_.color}33`, borderRadius: R.md }]}>
                  <Text style={{ fontSize: 18 }}>{s_.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.t2, textDecorationLine: 'line-through' }}>{s_.name}</Text>
                </View>
                <Text style={{ fontSize: 12, color: C.t3 }}>was {fmt(s_.cost)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />
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
  hero: {
    paddingTop: SP[6], paddingBottom: SP[5], alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11, color: C.t3, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase',
  },
  heroValue: {
    fontSize: 64, fontWeight: '700', color: C.t1, letterSpacing: -2, lineHeight: 70, marginTop: 8,
  },
  heroSub: {
    fontSize: 14, color: C.t3, fontWeight: '400', marginTop: 8,
  },
  totalDollar: {
    fontSize: 22, fontWeight: '700', color: C.t1,
  },
  segPill: {
    flexDirection: 'row', backgroundColor: C.bgSub, borderRadius: R.pill, padding: 2,
  },
  seg: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.pill,
  },
  segActive: {
    backgroundColor: C.black,
  },
  segTxt: {
    fontSize: 13, fontWeight: '500', color: C.t3,
  },
  segTxtActive: {
    color: '#fff',
  },
  catBar: {
    flexDirection: 'row', height: 5, borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.bgSub,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: R.pill, borderWidth: 1.5, flexShrink: 0,
  },
  catDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  catPillLabel: {
    fontSize: 12, fontWeight: '600',
  },
  catPillAmt: {
    fontSize: 12,
  },
  sectionCap: {
    fontSize: 11, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  trialBadge: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.sm,
  },
  trialBadgeTxt: {
    fontSize: 12, color: C.red,
  },
  trialCard: {
    minWidth: 160, backgroundColor: C.bgSub,
    borderWidth: 1, borderRadius: R.md,
    padding: 14, flexShrink: 0,
  },
  trialIcon: {
    width: 32, height: 32, borderRadius: R.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  trialName: {
    fontSize: 12, fontWeight: '600', color: C.t1,
  },
  trialDays: {
    fontSize: 12, fontWeight: '600',
  },
  trialCost: {
    fontSize: 12, color: C.t3, marginTop: 2,
  },
  subCount: {
    fontSize: 12, fontWeight: '600', color: C.t2,
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

// Sub row styles
const ss = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  trialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.redBg,
    borderWidth: 1, borderColor: C.redLine,
    borderRadius: R.sm, padding: 12, marginBottom: 4,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: R.pill,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowName: {
    fontSize: 14, fontWeight: '600', color: C.t1,
  },
  rowCost: {
    fontSize: 14, fontWeight: '700', color: C.t1,
  },
  rowCostSub: {
    fontSize: 10, fontWeight: '500', color: C.t3,
  },
  progressTrack: {
    height: 4, backgroundColor: C.bgSub, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  rowRenew: {
    fontSize: 12, fontWeight: '600',
  },
  rowMeta: {
    fontSize: 12, color: C.t3, marginTop: 4,
  },
  rowHours: {
    fontSize: 12, fontWeight: '600',
  },
});
