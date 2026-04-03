import Card from '@/components/Card';
import { C, R } from '@/constants/design';
import type { Category, SpendingSnapshot } from '@/store';
import { useSettings } from '@/store/settings';
import { fmt } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';

interface Props {
    history: SpendingSnapshot[];
    catMap: Record<string, Category>;
}

export default function SpendingChart({ history, catMap }: Props) {
    const { t } = useTranslation();
    const currency = useSettings(s => s.currency);
    const isPro = useSettings(s => s.isPro);
    // Show last 6 months, most recent on the right
    const recent = history.slice(0, 6).reverse();

    if (recent.length === 0) {
        return (
            <Card style={s.card}>
                <Text style={s.title}>{t('spending.title')}</Text>
                <Text style={s.empty}>{t('spending.empty')}</Text>
            </Card>
        );
    }

    const maxCost = Math.max(...recent.map(r => r.totalMonthlyCost), 1);
    const prevMonth = recent.length >= 2 ? recent[recent.length - 2].totalMonthlyCost : 0;
    const curMonth = recent[recent.length - 1].totalMonthlyCost;
    const diff = curMonth - prevMonth;

    // Find dominant category color for each month
    const barColor = (snap: SpendingSnapshot) => {
        const entries = Object.entries(snap.categoryBreakdown);
        if (entries.length === 0) return C.t3;
        const [topCat] = entries.sort((a, b) => b[1] - a[1])[0];
        return catMap[topCat]?.color ?? C.t3;
    };

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <Card style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={s.title}>{t('spending.title')}</Text>
                {recent.length >= 2 && (
                    <Text style={[s.trend, { color: diff > 0 ? C.red : diff < 0 ? C.green : C.t3 }]}>
                        {diff > 0 ? '+' : ''}{fmt(diff)} {t('spending.vsLastMonth')}
                    </Text>
                )}
            </View>

            <View style={s.barContainer}>
                {recent.map((snap, i) => {
                    const pct = snap.totalMonthlyCost / maxCost;
                    const isLast = i === recent.length - 1;
                    const isHistoric = !isLast && !isPro;
                    
                    return (
                        <View key={`${snap.year}-${snap.month}`} style={s.barCol}>
                            <View style={[s.barTrack, isHistoric && { opacity: 0.4 }]}>
                                <View style={[s.bar, {
                                    height: `${Math.max(4, pct * 100)}%`,
                                    backgroundColor: barColor(snap),
                                    opacity: isLast ? 1 : 0.6,
                                }]} />
                            </View>
                            <Text style={[s.barLabel, isLast && { fontWeight: '700', color: C.t1 }]}>
                                {MONTHS[snap.month]}
                            </Text>
                            {isHistoric ? (
                                <View style={{ marginTop: 2, height: 11, justifyContent: 'center' }}>
                                    <Lock size={10} color={C.gold} strokeWidth={3} />
                                </View>
                            ) : (
                                <Text style={s.barAmt}>{fmt(snap.totalMonthlyCost)}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}

const s = StyleSheet.create({
    card: {},
    title: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5,
    },
    trend: {
        fontSize: 11, fontWeight: '600',
    },
    empty: {
        fontSize: 12, color: C.t3, textAlign: 'center', paddingVertical: 24,
    },
    barContainer: {
        flexDirection: 'row', gap: 8, alignItems: 'flex-end',
    },
    barCol: {
        flex: 1, alignItems: 'center',
    },
    barTrack: {
        width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center',
    },
    bar: {
        width: '60%', borderRadius: 4, minHeight: 4,
    },
    barLabel: {
        fontSize: 10, color: C.t3, marginTop: 6, fontWeight: '500',
    },
    barAmt: {
        fontSize: 9, color: C.t3, marginTop: 2,
    },
});
