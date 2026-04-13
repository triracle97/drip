import AnimatedPressable from '@/components/AnimatedPressable';
import { C, R, SP } from '@/constants/design';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { fmt } from '@/utils/calc';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const IncomeSheet = forwardRef<TrueSheet>(function IncomeSheet(_props, ref) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { incomes, addIncome, updateIncome } = useStore();
    const currency = useSettings((s) => s.currency);
    const existing = incomes[0] ?? null;
    const { formatNumber, parseFormatted } = useNumberFormat();

    const [rawAmount, setRawAmount] = useState('');
    const [isHourly, setIsHourly] = useState(false);
    const [hours, setHours] = useState('40');

    // Keep a local ref so we can call dismiss() internally
    const sheetRef = useRef<TrueSheet>(null);
    const setRefs = useCallback((node: TrueSheet | null) => {
        sheetRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<TrueSheet | null>).current = node;
    }, [ref]);

    const handlePresent = useCallback(() => {
        if (existing) {
            setRawAmount(String(existing.amount));
            setIsHourly(existing.isHourly);
            setHours(String(existing.hoursPerWeek));
        } else {
            setRawAmount('');
            setIsHourly(false);
            setHours('40');
        }
    }, [existing]);

    const dismiss = useCallback(() => {
        sheetRef.current?.dismiss().catch(() => { });
    }, []);

    const canSave = parseFloat(rawAmount) > 0;

    const handleSave = () => {
        if (!canSave) return;
        const label = isHourly ? 'Hourly income' : 'Salary';
        const data = { label, amount: parseFloat(rawAmount), isHourly, hoursPerWeek: parseInt(hours) || 40 };
        if (existing) {
            updateIncome({ ...data, id: existing.id });
        } else {
            addIncome({ ...data, id: `i${Date.now()}` });
        }
        track(AnalyticsEvents.INCOME_UPDATED, {
            is_new: !existing,
            is_hourly: isHourly,
            amount: parseFloat(rawAmount),
        });
        dismiss();
    };

    const hourlyRate = parseFloat(rawAmount) > 0
        ? (isHourly ? parseFloat(rawAmount) : parseFloat(rawAmount) / (52 * (parseInt(hours) || 40)))
        : 0;

    return (
        <TrueSheet
            ref={setRefs}
            detents={['auto']}
            grabber={false}
            cornerRadius={24}
            dismissible={true}
            dimmed={true}
            dimmedDetentIndex={0}
            backgroundColor={C.bg}
            onWillPresent={handlePresent}
            footer={
                <View style={{ paddingHorizontal: SP[4], paddingBottom: (Platform.OS === 'ios' && Platform.isPad) ? 24 : Math.max(insets.bottom, 16) }}>
                    {/* Save button */}
                    <AnimatedPressable
                        onPress={handleSave}
                        disabled={!canSave}
                        style={[s.saveBtn, { backgroundColor: canSave ? C.black : C.bgSub, opacity: canSave ? 1 : 0.5 }]}
                    >
                        <Text style={[s.saveBtnText, { color: canSave ? '#fff' : C.t3 }]}>
                            {existing ? t('income.updateIncome') : t('income.addIncome')}
                        </Text>
                    </AnimatedPressable>
                </View>
            }
        >
            {/* Custom grabber */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', width: 40, height: 4, borderRadius: 99, marginTop: 8, marginBottom: 4 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flexShrink: 1 }}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SP[4], paddingBottom: 100 }}
                >
                    {/* Header */}
                    <View style={s.headerRow}>
                        <Text style={s.title}>{existing ? t('income.updateIncome') : t('income.addIncome')}</Text>
                        <TouchableOpacity onPress={dismiss} style={s.closeBtn} activeOpacity={0.7}>
                            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                                <Path d="M4 4l8 8M12 4l-8 8" stroke={C.t3} strokeWidth={1.8} strokeLinecap="round" />
                            </Svg>
                        </TouchableOpacity>
                    </View>

                    {/* Type */}
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>{t('income.type')}</Text>
                        <View style={s.segRow}>
                            {[
                                { v: false, l: t('income.annualSalary') },
                                { v: true, l: t('income.hourlyRate') },
                            ].map(({ v, l }) => (
                                <TouchableOpacity
                                    key={l}
                                    style={[s.seg, isHourly === v && s.segActive]}
                                    onPress={() => setIsHourly(v)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.segLabel, isHourly === v && s.segLabelActive]}>{l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>{isHourly ? t('income.hourlyRateLabel') : t('income.annualSalaryLabel')}</Text>
                        <View style={s.dollarRow}>
                            <Text style={s.dollarSign}>$</Text>
                            <TextInput
                                style={[s.inp, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                                value={formatNumber(rawAmount)}
                                onChangeText={(text) => setRawAmount(parseFormatted(text))}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={C.t3}
                            />
                        </View>
                    </View>

                    {/* Hours */}
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>{t('income.hoursPerWeek')}</Text>
                        <TextInput
                            style={s.inp}
                            value={hours}
                            onChangeText={setHours}
                            keyboardType="number-pad"
                            placeholder="40"
                            placeholderTextColor={C.t3}
                        />
                    </View>

                    {/* Rate preview */}
                    {hourlyRate > 0 && (
                        <View style={s.preview}>
                            <Text style={s.previewLabel}>{t('income.calculateRate')}</Text>
                            <Text style={s.previewValue}>{fmt(hourlyRate)}<Text style={s.previewUnit}>/hr</Text></Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </TrueSheet>
    );
});

export default IncomeSheet;

const s = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20, fontWeight: '700', color: C.t1,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: R.pill,
        backgroundColor: C.bgSub,
        alignItems: 'center', justifyContent: 'center',
    },
    field: {
        marginBottom: 18,
    },
    fieldLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 8,
    },
    inp: {
        backgroundColor: C.bgSub, borderRadius: R.md,
        padding: 14, fontSize: 16, fontWeight: '500', color: C.t1,
    },
    segRow: {
        flexDirection: 'row', backgroundColor: C.bgSub, borderRadius: R.pill, padding: 3,
    },
    seg: {
        flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center',
    },
    segActive: {
        backgroundColor: C.black,
    },
    segLabel: {
        fontSize: 13, fontWeight: '600', color: C.t3,
    },
    segLabelActive: {
        color: '#fff',
    },
    dollarRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.bgSub, borderRadius: R.md, paddingLeft: 14,
    },
    dollarSign: {
        fontSize: 18, color: C.t3, fontWeight: '500',
    },
    preview: {
        backgroundColor: C.greenBg, borderRadius: R.md,
        padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: C.greenLine,
        marginBottom: 18,
    },
    previewLabel: {
        fontSize: 10, fontWeight: '600', color: C.green, letterSpacing: 0.5, marginBottom: 4,
    },
    previewValue: {
        fontSize: 22, fontWeight: '700', color: C.green,
    },
    previewUnit: {
        fontSize: 13, fontWeight: '500',
    },
    saveBtn: {
        borderRadius: R.pill, paddingVertical: 15, alignItems: 'center', marginTop: 4,
    },
    saveBtnText: {
        fontSize: 14, fontWeight: '700',
    },
});
