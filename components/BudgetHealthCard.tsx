import Card from '@/components/Card';
import DonutChart from '@/components/DonutChart';
import { C } from '@/constants/design';
import type { Category } from '@/store';
import { useSettings } from '@/store/settings';
import { fmt } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CatSlice {
    categoryId: string;
    amount: number;
}

interface Props {
    slices: CatSlice[];
    catMap: Record<string, Category>;
    totalMo: number;
    moIncome: number;
    healthLabel: string;
    healthColor: string;
    healthPct: number;
}

export default function BudgetHealthCard({ slices, catMap, totalMo, moIncome, healthLabel, healthColor, healthPct }: Props) {
    const currency = useSettings(s => s.currency);
    const donutSlices = slices.map(s => ({
        value: s.amount,
        color: catMap[s.categoryId]?.color ?? '#8E8E93',
    }));

    return (
        <Card style={{ marginTop: 12 }}>
            <Text style={s.title}>BUDGET HEALTH</Text>
            <View style={s.row}>
                <DonutChart
                    slices={donutSlices}
                    size={120}
                    strokeWidth={12}
                    centerLabel={`${healthPct.toFixed(1)}%`}
                    centerSub="of income"
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={[s.badge, { backgroundColor: `${healthColor}15` }]}>
                        <View style={[s.badgeDot, { backgroundColor: healthColor }]} />
                        <Text style={[s.badgeLabel, { color: healthColor }]}>{healthLabel}</Text>
                    </View>
                    <Text style={s.stat}>
                        {fmt(totalMo)}<Text style={s.statSub}>/mo</Text>
                    </Text>
                    <Text style={s.statMeta}>
                        of {fmt(moIncome)}/mo income
                    </Text>

                    <View style={s.thresholds}>
                        {[
                            { label: '<5%', tag: 'Healthy', color: '#00C805' },
                            { label: '5-10%', tag: 'Moderate', color: '#F5A623' },
                            { label: '10-15%', tag: 'High', color: '#FF6B35' },
                            { label: '>15%', tag: 'Alert', color: '#FF3B30' },
                        ].map(t => (
                            <View key={t.tag} style={s.thRow}>
                                <View style={[s.thDot, { backgroundColor: t.color }]} />
                                <Text style={s.thLabel}>{t.label} {t.tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </Card>
    );
}

const s = StyleSheet.create({
    title: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 16,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
    },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
        marginBottom: 8,
    },
    badgeDot: {
        width: 6, height: 6, borderRadius: 3,
    },
    badgeLabel: {
        fontSize: 12, fontWeight: '700',
    },
    stat: {
        fontSize: 20, fontWeight: '800', color: C.t1,
    },
    statSub: {
        fontSize: 12, fontWeight: '500', color: C.t3,
    },
    statMeta: {
        fontSize: 11, color: C.t3, marginTop: 2,
    },
    thresholds: {
        marginTop: 10, gap: 3,
    },
    thRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    thDot: {
        width: 5, height: 5, borderRadius: 3,
    },
    thLabel: {
        fontSize: 9, color: C.t3, fontWeight: '500',
    },
});
