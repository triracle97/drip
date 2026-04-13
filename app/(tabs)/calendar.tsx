import ActivityLog from '@/components/ActivityLog';
import AnimatedPressable from '@/components/AnimatedPressable';
import EditSubSheet from '@/components/EditSubSheet';
import IncomeCTA from '@/components/IncomeCTA';
import IncomeSheet from '@/components/IncomeSheet';
import MonthSummaryCard from '@/components/MonthSummaryCard';
import ProSheet from '@/components/ProSheet';
import type { ProFeatureKey } from '@/components/ProSheet';
import TrialSheet from '@/components/TrialSheet';
import UpcomingChargeCompact from '@/components/UpcomingChargeCompact';
import UpcomingChargeHero from '@/components/UpcomingChargeHero';
import { C, LAYOUT, R } from '@/constants/design';
import { Sub, useStore } from '@/store';
import type { SubscriptionEvent } from '@/store/repository';
import { useSettings } from '@/store/settings';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { getEventsByMonth } from '@/store/repository';
import { blended, curMonth, curYear, fmt, monthName, nextChargeIn, subMo, toHrs } from '@/utils/calc';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Lock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import type { Category } from '@/store';

export default function TimelineScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
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
    const incomeRef = useRef<TrueSheet>(null);
    const [monthEvents, setMonthEvents] = useState<SubscriptionEvent[]>([]);
    const [proFeature, setProFeature] = useState<ProFeatureKey | null>(null);
    const isPro = useSettings(s => s.isPro);

    const isCurrentMonth = calMonth === curMonth && calYear === curYear;

    // Fetch events when month changes or subs change
    useEffect(() => {
        getEventsByMonth(calMonth, calYear).then(setMonthEvents);
    }, [calMonth, calYear, subs]);

    // Upcoming charges (current month only)
    const upcoming = useMemo(() => {
        if (!isCurrentMonth) return [];
        return subs
            .filter(s => s.active || s.isTrial)
            .map(s => ({ sub: s, daysLeft: nextChargeIn(s) }))
            .filter(({ daysLeft }) => daysLeft >= 0)
            .sort((a, b) => {
                // Trials always come first
                if (a.sub.isTrial && !b.sub.isTrial) return -1;
                if (!a.sub.isTrial && b.sub.isTrial) return 1;
                return a.daysLeft - b.daysLeft;
            });
    }, [subs, isCurrentMonth]);

    const heroCharge = upcoming[0] ?? null;
    const otherCharges = upcoming.slice(1);

    // For past months: filter subs that existed and were active in that month
    const subsForMonth = useMemo(() => {
        if (isCurrentMonth) return null; // use live data path instead
        const monthEnd = new Date(calYear, calMonth + 1, 0, 23, 59, 59).getTime();
        const monthStart = new Date(calYear, calMonth, 1).getTime();
        return subs.filter(s => {
            // Sub must have been created before end of selected month
            if (s.startDate) {
                const start = new Date(s.startDate).getTime();
                if (start > monthEnd) return false;
            }
            // Include if active or trial (it existed during this month)
            // For cancelled subs: they might have been active that month
            // but we can't know exactly without events, so include active + trials
            return true;
        });
    }, [subs, isCurrentMonth, calMonth, calYear]);

    // Month totals — use spending history for past months, live data for current month
    const { totalMo, catBreakdown, activeCount } = useMemo(() => {
        if (isCurrentMonth) {
            // Current month: compute from live subscriptions
            const active = subs.filter(s => s.active && !s.isTrial);
            const total = active.reduce((sum, s) => sum + subMo(s), 0);
            const bd: Record<string, number> = {};
            active.forEach(s => { bd[s.categoryId] = (bd[s.categoryId] || 0) + subMo(s); });
            const breakdown = Object.entries(bd)
                .map(([categoryId, amount]) => ({ categoryId, amount }))
                .sort((a, b) => b.amount - a.amount);
            return { totalMo: total, catBreakdown: breakdown, activeCount: active.length };
        }
        // Past month: pull from spending history snapshot first
        const snap = spendingHistory.find(s => s.month === calMonth && s.year === calYear);
        if (snap) {
            const breakdown = Object.entries(snap.categoryBreakdown)
                .map(([categoryId, amount]) => ({ categoryId, amount }))
                .sort((a, b) => b.amount - a.amount);
            return { totalMo: snap.totalMonthlyCost, catBreakdown: breakdown, activeCount: snap.subscriptionCount };
        }
        // No snapshot — compute from subs filtered by startDate
        const filtered = (subsForMonth ?? []).filter(s => !s.isTrial);
        // For subs that are currently inactive, we still don't know if they were active
        // during this month, so include all that existed (were started before month end)
        const total = filtered.reduce((sum, s) => sum + subMo(s), 0);
        const bd: Record<string, number> = {};
        filtered.forEach(s => { bd[s.categoryId] = (bd[s.categoryId] || 0) + subMo(s); });
        const breakdown = Object.entries(bd)
            .map(([categoryId, amount]) => ({ categoryId, amount }))
            .sort((a, b) => b.amount - a.amount);
        return { totalMo: total, catBreakdown: breakdown, activeCount: filtered.length };
    }, [subs, isCurrentMonth, spendingHistory, calMonth, calYear, subsForMonth]);

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={s.title}>{t('calendar.title')}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 32 }}
                showsVerticalScrollIndicator={false}
            >
                {incomes.length === 0 && <IncomeCTA onPress={() => incomeRef.current?.present()} />}

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
                        <Text style={s.sectionLabel}>{t('calendar.nextUp')}</Text>
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
                        {otherCharges.length > 0 && isPro && (
                            <>
                                {otherCharges.length <= 2 && (
                                    <View style={s.compactInlineRow}>
                                        {otherCharges.map(({ sub, daysLeft }) => (
                                            <View key={sub.id} style={{ flex: 1 }}>
                                                <UpcomingChargeCompact
                                                    name={sub.name}
                                                    icon={sub.icon}
                                                    color={sub.color}
                                                    daysLeft={daysLeft}
                                                    cost={fmt(sub.cost)}
                                                    onPress={() => handleSubPress(sub)}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {otherCharges.length > 2 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={s.compactScroll}
                                        style={s.compactScrollOuter}
                                    >
                                        {(() => {
                                            const pairs: { sub: typeof otherCharges[0]['sub']; daysLeft: number }[][] = [];
                                            for (let i = 0; i < otherCharges.length; i += 2) {
                                                pairs.push(otherCharges.slice(i, i + 2));
                                            }
                                            return pairs.map((pair, idx) => (
                                                <View key={idx} style={s.compactColumn}>
                                                    {pair.map(({ sub, daysLeft }) => (
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
                                            ));
                                        })()}
                                    </ScrollView>
                                )}
                            </>
                        )}
                    </Animated.View>
                )}

                {/* Divider between upcoming and summary */}
                {isCurrentMonth && heroCharge && (
                    <View style={s.divider} />
                )}

                {/* Pro Sections or Paywall */}
                {isPro ? (
                    <>
                        <Animated.View entering={FadeInDown.duration(300).delay(isCurrentMonth && heroCharge ? 200 : 100)}>
                            <MonthSummaryCard
                                breakdown={catBreakdown}
                                catMap={catMap}
                                totalMo={totalMo}
                                activeCount={activeCount}
                                prevMonthTotal={prevMonthTotal}
                                prevMonthLabel={prevMonthLabel}
                            />
                        </Animated.View>
                        <Animated.View entering={FadeInDown.duration(300).delay(isCurrentMonth && heroCharge ? 300 : 200)} style={{ marginTop: 8 }}>
                            <ActivityLog events={monthEvents} subMap={subMap} />
                        </Animated.View>
                    </>
                ) : (
                    <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                        <TouchableOpacity onPress={() => { track(AnalyticsEvents.PRO_GATE_HIT, { feature: 'calendar', source: 'calendar_tab' }); setProFeature('calendar'); }} activeOpacity={0.9} style={s.singlePaywallBox}>
                            <View style={s.singlePaywallIconBg}>
                                <Lock size={26} color={C.gold} strokeWidth={2.5} />
                            </View>
                            <Text style={s.singlePaywallTitle}>{t('calendar.proTitle') || 'Unlock Pro Insights'}</Text>
                            <Text style={s.singlePaywallText}>{t('calendar.proDesc') || 'See all upcoming charges, month-over-month summaries, and complete subscription activity.'}</Text>
                            <View style={s.singlePaywallBtn}>
                                <Text style={s.singlePaywallBtnText}>{t('calendar.upgrade') || 'Get Pro'}</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </ScrollView>

            <ProSheet feature={proFeature} onClose={() => setProFeature(null)} />
            <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />
            <EditSubSheet id={editSubId} onClose={() => setEditSubId(null)} />
            <IncomeSheet ref={incomeRef} />
        </View>
    );
}

const s = StyleSheet.create({
    header: {
        paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 16, backgroundColor: 'rgba(255,255,255,0.95)',
    },
    title: {
        fontSize: 22, fontWeight: '700', color: C.t1,
    },
    headerIcon: {
        width: 36, height: 36, borderRadius: R.sm,
        backgroundColor: C.black,
        alignItems: 'center', justifyContent: 'center',
    },
    sectionLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5,
        textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
    },
    compactInlineRow: {
        flexDirection: 'row', gap: 6, marginTop: 6,
    },
    compactScrollOuter: {
        marginTop: 6,
        marginHorizontal: -LAYOUT.screenHPad,
    },
    compactScroll: {
        paddingHorizontal: LAYOUT.screenHPad,
        gap: 6,
    },
    compactColumn: {
        width: (Dimensions.get('window').width - LAYOUT.screenHPad * 2 - 6) / 2,
        gap: 6,
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
    singlePaywallBox: {
        backgroundColor: C.surfaceElevated,
        borderRadius: R.md,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        marginTop: 4,
    },
    singlePaywallIconBg: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    singlePaywallTitle: {
        fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 8, textAlign: 'center',
    },
    singlePaywallText: {
        fontSize: 14, color: C.t2, textAlign: 'center', marginBottom: 24, lineHeight: 20,
    },
    singlePaywallBtn: {
        backgroundColor: C.black, paddingVertical: 14, paddingHorizontal: 24, borderRadius: R.md, width: '100%', alignItems: 'center',
    },
    singlePaywallBtnText: {
        color: '#FFF', fontWeight: '600', fontSize: 15,
    },
});
