import Card from '@/components/Card';
import { C, R } from '@/constants/design';
import type { Category } from '@/store';
import { fmt } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CatAmount {
    categoryId: string;
    amount: number;
}

interface Props {
    breakdown: CatAmount[];
    catMap: Record<string, Category>;
    totalMo: number;
    monthLabel: string;
}

export default function CategoryBreakdownList({ breakdown, catMap, totalMo, monthLabel }: Props) {
    if (breakdown.length === 0) return null;

    return (
        <Card style={{ marginTop: 12 }}>
            <Text style={s.title}>{monthLabel.toUpperCase()} BREAKDOWN</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
                {breakdown.map(({ categoryId, amount }) => {
                    const cat = catMap[categoryId];
                    const pct = totalMo > 0 ? (amount / totalMo) * 100 : 0;
                    return (
                        <View key={categoryId}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ fontSize: 14 }}>{cat?.icon ?? '📦'}</Text>
                                    <Text style={s.catName}>{cat?.name ?? 'Other'}</Text>
                                </View>
                                <Text style={s.catAmount}>{fmt(amount)} <Text style={s.catPct}>({pct.toFixed(0)}%)</Text></Text>
                            </View>
                            <View style={s.barTrack}>
                                <View style={[s.barFill, { width: `${Math.max(2, pct)}%`, backgroundColor: cat?.color ?? C.t3 }]} />
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}

const s = StyleSheet.create({
    title: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5,
    },
    catName: {
        fontSize: 13, fontWeight: '600', color: C.t1,
    },
    catAmount: {
        fontSize: 13, fontWeight: '600', color: C.t1,
    },
    catPct: {
        fontSize: 11, fontWeight: '500', color: C.t3,
    },
    barTrack: {
        height: 6, backgroundColor: C.bgSub, borderRadius: 3, overflow: 'hidden',
    },
    barFill: {
        height: '100%', borderRadius: 3,
    },
});
