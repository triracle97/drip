import AppearanceModal from '@/components/AppearanceModal';
import { C, LAYOUT, R } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { blended, cycleLabel, fmt, moEq, toHrs } from '@/utils/calc';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

const CYCLES: [string, string][] = [
    ['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Every month'],
    ['quarterly', 'Every 3 months'], ['biannual', 'Every 6 months'], ['yearly', 'Every year'], ['custom', 'Custom…'],
];

function cycleLabelFull(cycle: string, customNum?: string, customUnit?: string) {
    if (cycle === 'custom') return `Every ${customNum || 2} ${customUnit || 'months'}`;
    return CYCLES.find(([v]) => v === cycle)?.[1] ?? 'Every month';
}

export default function EditScreen() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { subs, updateSub, removeSub, incomes } = useStore();
    const rate = blended(incomes);

    const original = subs.find(s => s.id === id);
    const [f, setF] = useState<Sub>(original ? { ...original } : {
        id: '', name: '', icon: '📦', color: '#000', cost: 0, cycle: 'monthly',
        category: 'other', active: true, billDay: 1, isTrial: false, trialEndDay: 0,
        trialDecision: 'none',
    });
    const [costStr, setCostStr] = useState(String(f.cost));
    const [cycleOpen, setCycleOpen] = useState(false);
    const [showAppearance, setShowAppearance] = useState(false);
    const [customNum, setCustomNum] = useState(String(f.customNum ?? 2));
    const [customUnit, setCustomUnit] = useState(f.customUnit ?? 'months');

    if (!original) { router.back(); return null; }

    const mc = moEq(parseFloat(costStr) || 0, f.cycle, parseFloat(customNum) || 1, customUnit);

    const save = () => {
        updateSub({
            ...f, cost: parseFloat(costStr) || f.cost,
            customNum: f.cycle === 'custom' ? parseFloat(customNum) : undefined,
            customUnit: f.cycle === 'custom' ? customUnit : undefined,
        });
        router.back();
    };

    const remove = () => {
        removeSub(f.id);
        router.back();
    };

    const u = <K extends keyof Sub>(k: K, v: Sub[K]) => setF(prev => ({ ...prev, [k]: v }));

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
                    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                        <Path d="M10 3L5 8l5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={s.back}>Back</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>Edit</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Icon + Name Header */}
                <View style={s.iconHeader}>
                    <TouchableOpacity onPress={() => setShowAppearance(true)} activeOpacity={0.8}>
                        <View style={[s.bigIcon, { backgroundColor: f.color }]}>
                            <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            style={s.nameInput}
                            value={f.name}
                            onChangeText={v => u('name', v)}
                        />
                        <Text style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>
                            {cycleLabel(f)} · {fmt(f.cost)}
                        </Text>
                    </View>
                </View>

                {/* Price */}
                <Field label="PRICE">
                    <View style={s.dollarRow}>
                        <Text style={s.dollarSign}>$</Text>
                        <TextInput
                            style={[s.inp, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                            value={costStr}
                            onChangeText={setCostStr}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </Field>

                {/* Billing cycle */}
                <Field label="BILLING CYCLE">
                    <TouchableOpacity onPress={() => setCycleOpen(o => !o)} style={s.selectBtn} activeOpacity={0.8}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{cycleLabelFull(f.cycle, customNum, customUnit)}</Text>
                        <Text style={{ fontSize: 10, color: C.t3 }}>▼</Text>
                    </TouchableOpacity>
                    {cycleOpen && (
                        <View style={s.dropdown}>
                            {CYCLES.map(([v, l]) => (
                                <TouchableOpacity
                                    key={v}
                                    onPress={() => { u('cycle', v); setCycleOpen(false); }}
                                    style={[s.dropItem, f.cycle === v && { backgroundColor: C.bgSub }]}
                                    activeOpacity={0.75}
                                >
                                    <Text style={{ fontSize: 13, color: f.cycle === v ? C.t1 : C.t2, fontWeight: f.cycle === v ? '600' : '500' }}>{l}</Text>
                                    {f.cycle === v && <Text style={{ color: C.t1, fontSize: 12 }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {f.cycle === 'custom' && (
                        <View style={s.customCycleRow}>
                            <Text style={{ fontSize: 12, color: C.t2 }}>Every</Text>
                            <TextInput
                                style={[s.inp, { width: 52, textAlign: 'center' }]}
                                value={customNum}
                                onChangeText={setCustomNum}
                                keyboardType="number-pad"
                            />
                            <View style={s.segRow}>
                                {(['weeks', 'months', 'years'] as const).map(unit => (
                                    <TouchableOpacity key={unit} onPress={() => setCustomUnit(unit)} style={[s.seg, customUnit === unit && s.segActive]} activeOpacity={0.8}>
                                        <Text style={[s.segTxt, customUnit === unit && s.segTxtActive]}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </Field>

                {/* Category */}
                <Field label="CATEGORY">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {Object.entries(CATS).map(([k, c]) => {
                                const sel = f.category === k;
                                return (
                                    <TouchableOpacity
                                        key={k}
                                        onPress={() => u('category', k)}
                                        style={[s.catChip, { backgroundColor: sel ? `${c.color}CC` : 'rgba(0,0,0,0.04)', borderColor: sel ? c.color : 'rgba(0,0,0,0.04)' }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: sel ? '#fff' : C.t3 }}>{c.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </Field>

                {/* Active toggle */}
                <View style={[s.toggleBox, { backgroundColor: f.active ? C.bgSub : C.redBg, borderColor: f.active ? 'rgba(0,0,0,0.04)' : C.redLine }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.toggleLabel, { color: f.active ? C.t1 : C.red }]}>Active</Text>
                        <Text style={{ fontSize: 12, color: C.t3 }}>Toggle off to cancel</Text>
                    </View>
                    <Switch
                        value={f.active}
                        onValueChange={v => u('active', v)}
                        trackColor={{ false: 'rgba(0,0,0,0.16)', true: C.black }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Work preview */}
                {parseFloat(costStr) > 0 && (
                    <View style={s.workPreview}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: C.t3, fontWeight: '600', letterSpacing: 0.5 }}>THIS COSTS YOU</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: C.t1, marginTop: 2 }}>{toHrs(mc, rate)} of work</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14, color: C.t2, fontWeight: '700' }}>{fmt(mc)}<Text style={{ fontSize: 12, color: C.t3, fontWeight: '400' }}>/month</Text></Text>
                            <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{fmt(mc * 12)}/year</Text>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={save} style={[s.saveBtn, { flex: 2 }]} activeOpacity={0.85}>
                        <Text style={s.saveTxt}>Save changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={remove} style={[s.removeBtn, { flex: 1 }]} activeOpacity={0.85}>
                        <Text style={s.removeTxt}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <AppearanceModal
                visible={showAppearance}
                icon={f.icon}
                color={f.color}
                name={f.name}
                onChange={(icon, color) => { u('icon', icon); u('color', color); }}
                onClose={() => setShowAppearance(false)}
            />
        </View>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, color: C.t3, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 }}>{label}</Text>
            {children}
        </View>
    );
}

const s = StyleSheet.create({
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 12, backgroundColor: C.bg,
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8,
    },
    back: {
        fontSize: 14, color: C.t2, fontWeight: '500',
    },
    iconHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginBottom: 24, padding: 16, backgroundColor: 'transparent',
    },
    bigIcon: {
        width: 52, height: 52, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    nameInput: {
        fontSize: 18, fontWeight: '700', color: C.t1, padding: 0,
    },
    inp: {
        backgroundColor: C.bgSub, borderRadius: R.md, padding: 14,
        fontSize: 16, fontWeight: '500', color: C.t1,
    },
    dollarRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.bgSub, borderRadius: R.md, paddingLeft: 14,
    },
    dollarSign: {
        fontSize: 18, color: C.t3, fontWeight: '500',
    },
    selectBtn: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: C.bgSub, borderRadius: R.pill, padding: 14,
    },
    dropdown: {
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
        borderRadius: R.md, padding: 4, marginTop: 4, zIndex: 20,
    },
    dropItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderRadius: R.pill,
    },
    customCycleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.bgSub, borderRadius: R.md, padding: 10, marginTop: 8,
    },
    segRow: {
        flex: 1, flexDirection: 'row', backgroundColor: C.bgSub, borderRadius: R.pill, padding: 2,
    },
    seg: {
        flex: 1, paddingVertical: 6, borderRadius: R.pill, alignItems: 'center',
    },
    segActive: { backgroundColor: C.black },
    segTxt: { fontSize: 12, fontWeight: '600', color: C.t3 },
    segTxtActive: { color: '#fff' },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: R.pill, borderWidth: 1.5, flexShrink: 0,
    },
    toggleBox: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: R.md, borderWidth: 1.5, marginBottom: 20,
    },
    toggleLabel: {
        fontSize: 14, fontWeight: '600',
    },
    workPreview: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: C.bgSub, borderWidth: 1, borderColor: C.line,
        borderRadius: R.md, padding: 16, marginBottom: 24,
    },
    saveBtn: {
        backgroundColor: C.black, borderRadius: R.pill, paddingVertical: 15, alignItems: 'center',
    },
    saveTxt: {
        fontSize: 14, fontWeight: '700', color: '#fff',
    },
    removeBtn: {
        backgroundColor: C.redBg, borderWidth: 1.5, borderColor: C.redLine,
        borderRadius: R.pill, paddingVertical: 15, alignItems: 'center',
    },
    removeTxt: {
        fontSize: 14, fontWeight: '600', color: C.red,
    },
});
