import Card from '@/components/Card';
import { C, R } from '@/constants/design';
import type { Category } from '@/store';
import { useSettings } from '@/store/settings';
import { fmt } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';

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
    const { t } = useTranslation();
    const currency = useSettings(s => s.currency);
    const isPro = useSettings(s => s.isPro);
    if (breakdown.length === 0) return null;

    return (
        <Card style={{ marginTop: 12 }}>
            <Text style={s.title}>{t('breakdown.title', { month: monthLabel.toUpperCase() })}</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
                {breakdown.map(({ categoryId, amount }, index) => {
                    const cat = catMap[categoryId];
                    const pct = totalMo > 0 ? (amount / totalMo) * 100 : 0;
                    const isLocked = !isPro && index > 0;
                    
                    return (
                        <View key={categoryId} style={isLocked && { opacity: 0.5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[s.catDot, { backgroundColor: cat?.color ?? C.t3 }]} />
                                    <Text style={s.catName}>{cat?.name ?? t('breakdown.other')}</Text>
                                    {isLocked && <Lock size={12} color={C.gold} strokeWidth={2.5} />}
                                </View>
                                {!isLocked && <Text style={s.catAmount}>{fmt(amount)} <Text style={s.catPct}>({pct.toFixed(0)}%)</Text></Text>}
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
    catDot: {
        width: 8, height: 8, borderRadius: 4,
    },
});
