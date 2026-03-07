import BudgetHealthCard from '@/components/BudgetHealthCard';
import CategoryBreakdownList from '@/components/CategoryBreakdownList';
import SpendingChart from '@/components/SpendingChart';
import { C, LAYOUT } from '@/constants/design';
import { Category, useStore } from '@/store';
import { budgetHealth, fmt, monthlyIncome, monthName, subMo } from '@/utils/calc';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InsightsScreen() {
    const insets = useSafeAreaInsets();
    const { subs, incomes, categories, spendingHistory, recordSnapshot } = useStore();

    const catMap = useMemo(() => {
        const m: Record<string, Category> = {};
        categories.forEach(c => { m[c.id] = c; });
        return m;
    }, [categories]);

    const activeSubs = subs.filter(s => s.active && !s.isTrial);
    const totalMo = activeSubs.reduce((sum, s) => sum + subMo(s), 0);
    const moIncome = monthlyIncome(incomes);
    const health = budgetHealth(totalMo, moIncome);

    // Record snapshot on mount
    useEffect(() => {
        if (activeSubs.length > 0) {
            recordSnapshot();
        }
    }, []);

    // Category breakdown for current month
    const catBreakdown = useMemo(() => {
        const bd: Record<string, number> = {};
        activeSubs.forEach(s => {
            bd[s.categoryId] = (bd[s.categoryId] || 0) + subMo(s);
        });
        return Object.entries(bd)
            .map(([categoryId, amount]) => ({ categoryId, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [activeSubs]);

    const now = new Date();
    const currentMonthLabel = monthName(now.getMonth(), now.getFullYear());

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Text style={s.title}>Insights</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Spending Trend */}
                <Animated.View entering={FadeInDown.duration(300)}>
                    <SpendingChart history={spendingHistory} catMap={catMap} />
                </Animated.View>

                {/* Category Breakdown */}
                <Animated.View entering={FadeInDown.duration(300).delay(100)}>
                    <CategoryBreakdownList
                        breakdown={catBreakdown}
                        catMap={catMap}
                        totalMo={totalMo}
                        monthLabel={currentMonthLabel}
                    />
                </Animated.View>

                {/* Budget Health */}
                <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                    <BudgetHealthCard
                        slices={catBreakdown}
                        catMap={catMap}
                        totalMo={totalMo}
                        moIncome={moIncome}
                        healthLabel={health.label}
                        healthColor={health.color}
                        healthPct={health.pct}
                    />
                </Animated.View>

                {/* Per-category % of income */}
                {moIncome > 0 && catBreakdown.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(300).delay(300)}>
                        <View style={s.perCatCard}>
                            <Text style={s.sectionTitle}>PER-CATEGORY BREAKDOWN</Text>
                            <View style={{ gap: 8, marginTop: 8 }}>
                                {catBreakdown.map(({ categoryId, amount }) => {
                                    const cat = catMap[categoryId];
                                    const pctOfSubs = totalMo > 0 ? (amount / totalMo) * 100 : 0;
                                    const pctOfIncome = (amount / moIncome) * 100;
                                    return (
                                        <View key={categoryId} style={s.perCatRow}>
                                            <Text style={{ fontSize: 14 }}>{cat?.icon ?? '📦'}</Text>
                                            <Text style={s.perCatName}>{cat?.name ?? 'Other'}</Text>
                                            <Text style={s.perCatAmt}>{fmt(amount)}</Text>
                                            <Text style={s.perCatPct}>{pctOfSubs.toFixed(0)}% subs</Text>
                                            <Text style={[s.perCatPct, { color: pctOfIncome > 5 ? C.red : C.t3 }]}>
                                                {pctOfIncome.toFixed(1)}% income
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
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
    sectionTitle: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5,
    },
    perCatCard: {
        marginTop: 12, backgroundColor: C.surfaceElevated, borderRadius: 16, padding: 16,
    },
    perCatRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    perCatName: {
        flex: 1, fontSize: 12, fontWeight: '600', color: C.t1,
    },
    perCatAmt: {
        fontSize: 12, fontWeight: '600', color: C.t1, width: 60, textAlign: 'right',
    },
    perCatPct: {
        fontSize: 10, color: C.t3, width: 60, textAlign: 'right',
    },
});
