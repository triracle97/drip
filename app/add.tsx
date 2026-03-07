import AppearanceModal from '@/components/AppearanceModal';
import { C, LAYOUT, R } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { blended, curDay, fmt, moEq, toHrs } from '@/utils/calc';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
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

const QUICK_PICKS = [
    { name: 'Netflix', icon: '▶️', cat: 'entertainment', cost: 15.99, bg: '#E50914' },
    { name: 'Spotify', icon: '🎵', cat: 'entertainment', cost: 10.99, bg: '#1DB954' },
    { name: 'YouTube', icon: '📺', cat: 'entertainment', cost: 13.99, bg: '#FF0000' },
    { name: 'ChatGPT', icon: '🧠', cat: 'productivity', cost: 20, bg: '#10A37F' },
    { name: 'iCloud+', icon: '☁️', cat: 'productivity', cost: 2.99, bg: '#3693F5' },
    { name: 'GitHub', icon: '⌨️', cat: 'productivity', cost: 4, bg: '#24292e' },
    { name: 'Figma', icon: '✏️', cat: 'productivity', cost: 12, bg: '#A259FF' },
    { name: 'Gym', icon: '🏋️', cat: 'health', cost: 49.99, bg: '#333333' },
    { name: 'Disney+', icon: '🎬', cat: 'entertainment', cost: 13.99, bg: '#0057B8' },
    { name: 'Apple TV+', icon: '📱', cat: 'entertainment', cost: 9.99, bg: '#000000' },
];

const CYCLES: [string, string][] = [
    ['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Every month'],
    ['quarterly', 'Every 3 months'], ['biannual', 'Every 6 months'], ['yearly', 'Every year'], ['custom', 'Custom…'],
];

interface Form {
    name: string;
    icon: string;
    color: string;
    cost: string;
    cycle: string;
    category: string;
    billDay: string;
    startDate: string;
    isTrial: boolean;
    trialDays: string;
    customNum: string;
    customUnit: string;
}

const DEFAULT_FORM: Form = {
    name: '', icon: '📦', color: '#000000',
    cost: '', cycle: 'monthly', category: 'other',
    billDay: '1', startDate: new Date().toISOString().split('T')[0],
    isTrial: false, trialDays: '14',
    customNum: '2', customUnit: 'months',
};

function cycleLabelFull(f: Form) {
    if (f.cycle === 'custom') return `Every ${f.customNum || 2} ${f.customUnit || 'months'}`;
    return CYCLES.find(([v]) => v === f.cycle)?.[1] ?? 'Every month';
}

export default function AddScreen() {
    const insets = useSafeAreaInsets();
    const { addSub, incomes } = useStore();
    const rate = blended(incomes);

    const [phase, setPhase] = useState<'pick' | 'form'>('pick');
    const [f, setF] = useState<Form>({ ...DEFAULT_FORM });
    const [cycleOpen, setCycleOpen] = useState(false);
    const [showAppearance, setShowAppearance] = useState(false);

    const u = (k: keyof Form, v: any) => setF(prev => ({ ...prev, [k]: v }));
    const mc = moEq(parseFloat(f.cost) || 0, f.cycle, parseFloat(f.customNum) || 1, f.customUnit);
    const canSave = f.name.trim() && parseFloat(f.cost) > 0;

    const pickBrand = (q: typeof QUICK_PICKS[0]) => {
        setF({ ...DEFAULT_FORM, name: q.name, icon: q.icon, category: q.cat, cost: String(q.cost), color: q.bg });
        setPhase('form');
    };
    const pickCustom = () => { setF({ ...DEFAULT_FORM }); setPhase('form'); };

    const save = () => {
        if (!canSave) return;
        const trialEnd = f.isTrial ? curDay + parseInt(f.trialDays) : 0;
        const bd = f.startDate ? new Date(f.startDate).getDate() : parseInt(f.billDay) || 1;
        const newSub: Sub = {
            id: `s${Date.now()}`, name: f.name, icon: f.icon, cost: parseFloat(f.cost),
            cycle: f.cycle, category: f.category, active: true, billDay: bd,
            startDate: f.startDate, color: f.color,
            isTrial: f.isTrial, trialEndDay: trialEnd,
            trialDecision: f.isTrial ? 'pending' : 'none',
            customNum: f.cycle === 'custom' ? parseFloat(f.customNum) || 1 : undefined,
            customUnit: f.cycle === 'custom' ? f.customUnit : undefined,
        };
        addSub(newSub);
        router.back();
    };

    /* ─── SCREEN 1: BRAND PICKER ─── */
    if (phase === 'pick') {
        return (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
                        <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                            <Path d="M10 3L5 8l5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={s.back}>Back</Text>
                    </TouchableOpacity>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 60 }}>
                    <Text style={s.title}>Add subscription</Text>
                    <Text style={s.subtitle}>Choose a service or add your own</Text>

                    <View style={s.brandGrid}>
                        {QUICK_PICKS.map(q => (
                            <TouchableOpacity key={q.name} onPress={() => pickBrand(q)} style={s.brandCell} activeOpacity={0.8}>
                                <View style={[s.brandIcon, { backgroundColor: q.bg }]}>
                                    <Text style={{ fontSize: 22 }}>{q.icon}</Text>
                                </View>
                                <Text style={s.brandName}>{q.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity onPress={pickCustom} style={s.customRow} activeOpacity={0.8}>
                        <View style={s.customPlus}>
                            <Text style={{ fontSize: 20, color: C.t1, fontWeight: '500' }}>+</Text>
                        </View>
                        <View>
                            <Text style={s.customLabel}>Custom subscription</Text>
                            <Text style={s.customSub}>Add any service not listed</Text>
                        </View>
                        <Svg width={12} height={12} viewBox="0 0 16 16" fill="none" style={{ marginLeft: 'auto' }}>
                            <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    /* ─── SCREEN 2: DETAIL FORM ─── */
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => setPhase('pick')} style={s.backBtn} activeOpacity={0.7}>
                    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                        <Path d="M10 3L5 8l5 5" stroke={C.t2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={s.back}>Change service</Text>
                </TouchableOpacity>
                <View style={{ width: 80 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Name */}
                <Field label="NAME">
                    <TextInput
                        style={s.inp}
                        value={f.name}
                        onChangeText={v => u('name', v)}
                        placeholder="Subscription name…"
                        placeholderTextColor={C.t3}
                        autoFocus
                    />
                </Field>

                {/* Price */}
                <Field label="PRICE">
                    <View style={s.dollarRow}>
                        <Text style={s.dollarSign}>$</Text>
                        <TextInput
                            style={[s.inp, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                            value={f.cost}
                            onChangeText={v => u('cost', v)}
                            placeholder="0.00"
                            placeholderTextColor={C.t3}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </Field>

                {/* Billing cycle */}
                <Field label="BILLING CYCLE">
                    <TouchableOpacity onPress={() => setCycleOpen(o => !o)} style={s.selectBtn} activeOpacity={0.8}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{cycleLabelFull(f)}</Text>
                        <Text style={{ fontSize: 10, color: C.t3, transform: [{ rotate: cycleOpen ? '180deg' : '0deg' }] }}>▼</Text>
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
                                value={f.customNum}
                                onChangeText={v => u('customNum', v)}
                                keyboardType="number-pad"
                            />
                            <View style={s.segRow}>
                                {(['weeks', 'months', 'years'] as const).map(unit => (
                                    <TouchableOpacity key={unit} onPress={() => u('customUnit', unit)} style={[s.seg, f.customUnit === unit && s.segActive]} activeOpacity={0.8}>
                                        <Text style={[s.segTxt, f.customUnit === unit && s.segTxtActive]}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</Text>
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

                {/* Start date */}
                <Field label="START DATE">
                    <Text style={[s.inp, { color: C.t1, fontSize: 14, fontWeight: '500' }]}>
                        {f.startDate || 'Today'}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>Bills on this date every cycle</Text>
                </Field>

                {/* Icon & Color */}
                <Field label="ICON & COLOR">
                    <TouchableOpacity onPress={() => setShowAppearance(true)} style={s.appearanceRow} activeOpacity={0.8}>
                        <View style={[s.iconPreview, { backgroundColor: f.color }]}>
                            <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: C.t1 }}>{f.name || 'Subscription'}</Text>
                            <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>Tap to change icon or color</Text>
                        </View>
                        <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                            <Path d="M6 3l5 5-5 5" stroke={C.t3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </TouchableOpacity>
                </Field>

                {/* Trial toggle */}
                <View style={[s.trialBox, { backgroundColor: f.isTrial ? C.redBg : C.bgSub, borderColor: f.isTrial ? C.redLine : 'transparent' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.trialLabel, { color: f.isTrial ? C.red : C.t1 }]}>Free trial</Text>
                        <Text style={{ fontSize: 12, color: C.t3 }}>Get reminded before it charges</Text>
                    </View>
                    <Switch
                        value={f.isTrial}
                        onValueChange={v => u('isTrial', v)}
                        trackColor={{ false: 'rgba(0,0,0,0.16)', true: C.black }}
                        thumbColor="#fff"
                    />
                </View>

                {f.isTrial && (
                    <View style={s.trialDaysRow}>
                        <Text style={{ fontSize: 10, color: C.red, fontWeight: '600', marginBottom: 8 }}>TRIAL LENGTH</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {['7', '14', '30'].map(d => (
                                <TouchableOpacity
                                    key={d}
                                    onPress={() => u('trialDays', d)}
                                    style={[s.trialDayBtn, f.trialDays === d && { backgroundColor: C.redBg, borderColor: C.redLine }]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: f.trialDays === d ? C.red : C.t3 }}>{d}d</Text>
                                </TouchableOpacity>
                            ))}
                            <TextInput
                                style={[s.inp, { flex: 1, textAlign: 'center', color: C.red }]}
                                value={!['7', '14', '30'].includes(f.trialDays) ? f.trialDays : ''}
                                onChangeText={v => u('trialDays', v)}
                                placeholder="Custom"
                                placeholderTextColor={C.t3}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>
                )}

                {/* Work preview */}
                {parseFloat(f.cost) > 0 && (
                    <View style={s.workPreview}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: C.t3, fontWeight: '600', letterSpacing: 0.5 }}>
                                {f.isTrial ? `AFTER ${f.trialDays} DAYS` : 'THIS COSTS YOU'}
                            </Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: C.t1, marginTop: 2 }}>{toHrs(mc, rate)} of work</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14, color: C.t2, fontWeight: '700' }}>{fmt(mc)}<Text style={{ fontSize: 12, color: C.t3, fontWeight: '400' }}>/month</Text></Text>
                            <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{fmt(mc * 12)}/year</Text>
                        </View>
                    </View>
                )}

                {/* Save */}
                <TouchableOpacity
                    onPress={save}
                    disabled={!canSave}
                    style={[s.saveBtn, { backgroundColor: canSave ? C.black : C.bgSub, opacity: canSave ? 1 : 0.5 }]}
                    activeOpacity={0.85}
                >
                    <Text style={[s.saveTxt, { color: canSave ? '#fff' : C.t3 }]}>
                        {f.isTrial ? `Add trial — remind me in ${f.trialDays} days` : 'Add subscription'}
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: LAYOUT.screenHPad, paddingBottom: 12,
        backgroundColor: C.bg,
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 8,
    },
    back: {
        fontSize: 14, color: C.t2, fontWeight: '500',
    },
    title: {
        fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 4,
    },
    subtitle: {
        fontSize: 12, color: C.t3, marginBottom: 24,
    },
    brandGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    brandCell: {
        width: '22%', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 4,
        backgroundColor: C.bgSub, borderRadius: R.pill,
    },
    brandIcon: {
        width: 44, height: 44, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center',
    },
    brandName: {
        fontSize: 11, fontWeight: '600', color: C.t1, textAlign: 'center',
    },
    customRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: C.bgSub, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line,
        borderRadius: R.pill, padding: 16, marginTop: 12,
    },
    customPlus: {
        width: 44, height: 44, borderRadius: R.md, backgroundColor: C.bg,
        borderWidth: 1, borderColor: C.line,
        alignItems: 'center', justifyContent: 'center',
    },
    customLabel: {
        fontSize: 14, fontWeight: '600', color: C.t1,
    },
    customSub: {
        fontSize: 12, color: C.t3, marginTop: 2,
    },
    inp: {
        backgroundColor: C.bgSub, borderRadius: R.md,
        padding: 14, fontSize: 16, fontWeight: '500', color: C.t1,
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
    appearanceRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: C.bgSub, borderRadius: R.pill, padding: 12,
    },
    iconPreview: {
        width: 48, height: 48, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    trialBox: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: R.md, borderWidth: 1.5, marginBottom: 0,
    },
    trialLabel: {
        fontSize: 14, fontWeight: '600',
    },
    trialDaysRow: {
        backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redLine,
        borderTopWidth: 0, borderBottomLeftRadius: R.md, borderBottomRightRadius: R.md,
        padding: 14, marginBottom: 20,
    },
    trialDayBtn: {
        flex: 1, padding: 8, borderRadius: R.md, alignItems: 'center',
        backgroundColor: C.bgSub, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)',
    },
    workPreview: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: C.bgSub, borderWidth: 1, borderColor: C.line,
        borderRadius: R.md, padding: 16, marginBottom: 24,
    },
    saveBtn: {
        borderRadius: R.pill, paddingVertical: 15, alignItems: 'center',
    },
    saveTxt: {
        fontSize: 16, fontWeight: '700',
    },
});
