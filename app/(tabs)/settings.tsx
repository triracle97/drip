import IncomeSheet from '@/components/IncomeSheet';
import { C, LAYOUT, R, SP } from '@/constants/design';
import { useStore } from '@/store';
import { blended, fmt, subMo, toHrs } from '@/utils/calc';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { incomes, subs } = useStore();
    const [showIncome, setShowIncome] = useState(false);
    const rate = blended(incomes);
    const totalMo = subs.filter(s => s.active && !s.isTrial).reduce((sum, s) => sum + subMo(s), 0);

    const rows = [
        {
            id: 'income',
            label: '💰 Manage income',
            hint: `${fmt(rate)}/hr blended`,
            onPress: () => setShowIncome(true),
        },
        {
            id: 'theme',
            label: '🎨 Appearance',
            hint: 'Light (only right now)',
            onPress: () => { },
        },
        {
            id: 'currency',
            label: '🌐 Currency',
            hint: 'USD',
            onPress: () => { },
        },
        {
            id: 'notifications',
            label: '🔔 Notifications',
            hint: 'Off',
            onPress: () => { },
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Text style={s.title}>Settings</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: LAYOUT.tabBarHeight + 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary card */}
                <View style={s.summaryCard}>
                    <Text style={s.summaryLabel}>TOTAL MONTHLY COST</Text>
                    <Text style={s.summaryValue}>{fmt(totalMo)}</Text>
                    <Text style={s.summarySub}>= {toHrs(totalMo, rate)} of work at {fmt(rate)}/hr blended</Text>
                </View>

                {/* Income section */}
                <Text style={s.sectionCap}>INCOME & RATE</Text>
                {rows.slice(0, 1).map(r => (
                    <TouchableOpacity key={r.id} onPress={r.onPress} style={s.row} activeOpacity={0.75}>
                        <Text style={s.rowLabel}>{r.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={s.rowHint}>{r.hint}</Text>
                            <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                                <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* General */}
                <Text style={[s.sectionCap, { marginTop: 24 }]}>GENERAL</Text>
                {rows.slice(1).map(r => (
                    <TouchableOpacity key={r.id} onPress={r.onPress} style={s.row} activeOpacity={0.75}>
                        <Text style={s.rowLabel}>{r.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={s.rowHint}>{r.hint}</Text>
                            <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                                <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Version */}
                <Text style={s.version}>Drip v1.0 · Track what you pay with your time</Text>
            </ScrollView>

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
    summaryCard: {
        backgroundColor: C.bgSub, borderRadius: R.md, padding: SP[3], marginBottom: SP[4],
    },
    summaryLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 4,
    },
    summaryValue: {
        fontSize: 32, fontWeight: '700', color: C.t1,
    },
    summarySub: {
        fontSize: 12, color: C.t2, marginTop: 4,
    },
    sectionCap: {
        fontSize: 11, fontWeight: '500', color: C.t3, letterSpacing: 0.5, marginBottom: 12,
    },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.line,
    },
    rowLabel: {
        fontSize: 14, color: C.t1, fontWeight: '500',
    },
    rowHint: {
        fontSize: 13, color: C.t3,
    },
    version: {
        fontSize: 11, color: C.t3, textAlign: 'center', marginTop: 40,
    },
});
