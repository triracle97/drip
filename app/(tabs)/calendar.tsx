import AnimatedPressable from '@/components/AnimatedPressable';
import Card from '@/components/Card';
import TrialSheet from '@/components/TrialSheet';
import { C, LAYOUT, R, SHADOW } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { blended, curDay, curMonth, curYear, dayName, daysInMonth, fmt, monthName, subMo, toHrs } from '@/utils/calc';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Category } from '@/store';

export default function CalendarScreen() {
    const insets = useSafeAreaInsets();
    const { subs, incomes, categories } = useStore();
    const rate = blended(incomes);

    const catMap = useMemo(() => {
        const m: Record<string, Category> = {};
        categories.forEach(c => { m[c.id] = c; });
        return m;
    }, [categories]);

    const [calMonth, setCalMonth] = useState(curMonth);
    const [calYear, setCalYear] = useState(curYear);
    const [calDay, setCalDay] = useState<number | null>(null);
    const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
    const stripRef = useRef<ScrollView>(null);

    const calDays = daysInMonth(calMonth, calYear);

    const billMap = useMemo(() => {
        const map: Record<number, Sub[]> = {};
        subs.filter(s => s.active || s.isTrial).forEach(s => {
            const d = s.isTrial ? s.trialEndDay : s.billDay;
            if (d >= 1 && d <= calDays) {
                if (!map[d]) map[d] = [];
                map[d].push(s);
            }
        });
        return map;
    }, [subs, calMonth, calYear, calDays]);

    const maxDayCost = useMemo(() => {
        let mx = 0;
        Object.values(billMap).forEach(arr => {
            const t = arr.reduce((s, x) => s + subMo(x), 0);
            if (t > mx) mx = t;
        });
        return mx || 1;
    }, [billMap]);

    const moTotal = useMemo(() =>
        Object.values(billMap).flat().reduce((s, x) => s + subMo(x), 0),
        [billMap]);

    const daySubs = calDay ? (billMap[calDay] || []) : [];
    const dayTotal = daySubs.reduce((s, x) => s + subMo(x), 0);

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
        else setCalMonth(calMonth - 1);
        setCalDay(null);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
        else setCalMonth(calMonth + 1);
        setCalDay(null);
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <AnimatedPressable onPress={prevMonth} style={s.navBtn}>
                    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                        <Path d="M10 3L5 8l5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </AnimatedPressable>
                <View style={{ alignItems: 'center' }}>
                    <Text style={s.monthTitle}>{monthName(calMonth, calYear)}</Text>
                    <Text style={s.monthMeta}>{fmt(moTotal)} · {toHrs(moTotal, rate)}</Text>
                </View>
                <AnimatedPressable onPress={nextMonth} style={s.navBtn}>
                    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                        <Path d="M6 3l5 5-5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </AnimatedPressable>
            </View>

            {/* Day strip */}
            <ScrollView
                ref={stripRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', gap: 2 }}
                style={{ flexGrow: 0 }}
                onLayout={() => {
                    if (calMonth === curMonth && calYear === curYear && stripRef.current) {
                        setTimeout(() => {
                            stripRef.current?.scrollTo({ x: (curDay - 4) * 46, animated: true });
                        }, 200);
                    }
                }}
            >
                {Array.from({ length: calDays }, (_, i) => {
                    const d = i + 1;
                    const hasBill = !!billMap[d];
                    const isToday = d === curDay && calMonth === curMonth && calYear === curYear;
                    const isSel = calDay === d;
                    const dayCost = (billMap[d] || []).reduce((s, x) => s + subMo(x), 0);
                    const barH = hasBill ? Math.max(6, (dayCost / maxDayCost) * 32) : 0;
                    const hasTrial = (billMap[d] || []).some(s => s.isTrial);
                    const domCat = (billMap[d] || []).sort((a, b) => subMo(b) - subMo(a))[0]?.categoryId;
                    const barColor = catMap[domCat]?.color ?? C.t3;
                    const isWeekend = new Date(calYear, calMonth, d).getDay() % 6 === 0;

                    return (
                        <TouchableOpacity
                            key={d}
                            onPress={() => setCalDay(calDay === d ? null : d)}
                            style={[
                                s.dayCell,
                                isToday && { borderColor: C.black, borderWidth: 1.5 },
                                isSel && { backgroundColor: C.bgSub },
                                !isToday && !isSel && { borderColor: 'transparent', borderWidth: 1 },
                                isWeekend && !hasBill && { opacity: 0.5 },
                            ]}
                            activeOpacity={0.75}
                        >
                            <Text style={s.dayName}>{dayName(d, calMonth, calYear)}</Text>
                            <Text style={[s.dayNum, { fontWeight: isToday ? '700' : '500' }]}>{d}</Text>
                            <View style={{ width: '100%', height: 34, alignItems: 'center', justifyContent: 'flex-end' }}>
                                {hasBill ? (
                                    <View style={[s.dayBar, { height: barH, backgroundColor: barColor, opacity: hasTrial ? 0.5 : 1 }]} />
                                ) : (
                                    <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: C.bgSub }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Day detail */}
            {calDay && (
                <Animated.View entering={FadeInDown.duration(250)}>
                    <Card style={s.dayDetail}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>
                                {new Date(calYear, calMonth, calDay).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                            {daySubs.length > 0 && (
                                <Text style={{ fontSize: 12, color: C.t1 }}>{fmt(dayTotal)} · {toHrs(dayTotal, rate)}</Text>
                            )}
                        </View>
                        {daySubs.length === 0 ? (
                            <Text style={{ fontSize: 12, color: C.t3, textAlign: 'center', paddingVertical: 12 }}>
                                No drips today
                            </Text>
                        ) : (
                            <View style={{ gap: 8 }}>
                                {daySubs.map(sub => (
                                    <AnimatedPressable
                                        key={sub.id}
                                        onPress={() => sub.isTrial ? setTrialSheet(sub) : router.push({ pathname: '/edit', params: { id: sub.id } })}
                                        style={[s.daySubRow, {
                                            backgroundColor: sub.isTrial ? C.redBg : C.surface,
                                            borderColor: sub.isTrial ? C.redLine : C.line,
                                        }]}
                                    >
                                        <View style={[s.daySubIcon, { backgroundColor: sub.color }]}>
                                            <Text style={{ fontSize: 14 }}>{sub.icon}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: C.t1 }}>{sub.name}</Text>
                                                {sub.isTrial && (
                                                    <View style={{ backgroundColor: C.redBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.sm }}>
                                                        <Text style={{ fontSize: 10, color: C.red, fontWeight: '600' }}>TRIAL ENDS</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: C.t1 }}>{fmt(sub.cost)}</Text>
                                            <Text style={{ fontSize: 12, color: C.t2 }}>{toHrs(subMo(sub), rate)}</Text>
                                        </View>
                                    </AnimatedPressable>
                                ))}
                            </View>
                        )}
                    </Card>
                </Animated.View>
            )}

            <View style={{ flex: 1 }} />
            <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />
        </View>
    );
}

const s = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 16,
        backgroundColor: C.bg,
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
    dayCell: {
        width: 44, minWidth: 44, height: 78,
        flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 4, borderRadius: R.pill,
    },
    dayName: {
        fontSize: 10, color: C.t3, marginBottom: 2,
    },
    dayNum: {
        fontSize: 12, color: C.t1,
    },
    dayBar: {
        width: 6, borderRadius: 6,
    },
    dayDetail: {
        marginHorizontal: 12, marginTop: 8,
    },
    daySubRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: R.md, padding: 10, borderWidth: 1,
    },
    daySubIcon: {
        width: 34, height: 34, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
});
