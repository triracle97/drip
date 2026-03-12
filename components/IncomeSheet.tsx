import AnimatedPressable from '@/components/AnimatedPressable';
import { C, R, SP } from '@/constants/design';
import { useStore } from '@/store';
import { fmt } from '@/utils/calc';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function IncomeSheet({ visible, onClose }: Props) {
    const { incomes, addIncome, updateIncome } = useStore();
    const existing = incomes[0] ?? null;

    const [amount, setAmount] = useState('');
    const [isHourly, setIsHourly] = useState(false);
    const [hours, setHours] = useState('40');

    const handlePresent = () => {
        if (existing) {
            setAmount(String(existing.amount));
            setIsHourly(existing.isHourly);
            setHours(String(existing.hoursPerWeek));
        } else {
            setAmount('');
            setIsHourly(false);
            setHours('40');
        }
    };

    const canSave = parseFloat(amount) > 0;

    const handleSave = () => {
        if (!canSave) return;
        const label = isHourly ? 'Hourly income' : 'Salary';
        const data = { label, amount: parseFloat(amount), isHourly, hoursPerWeek: parseInt(hours) || 40 };
        if (existing) {
            updateIncome({ ...data, id: existing.id });
        } else {
            addIncome({ ...data, id: `i${Date.now()}` });
        }
        onClose();
    };

    const hourlyRate = parseFloat(amount) > 0
        ? (isHourly ? parseFloat(amount) : parseFloat(amount) / (52 * (parseInt(hours) || 40)))
        : 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={handlePresent}>
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <View style={s.sheet}>
                    {/* Handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.headerRow}>
                        <Text style={s.title}>{existing ? 'Update Income' : 'Add Income'}</Text>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
                            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                                <Path d="M4 4l8 8M12 4l-8 8" stroke={C.t3} strokeWidth={1.8} strokeLinecap="round" />
                            </Svg>
                        </TouchableOpacity>
                    </View>

                    {/* Type */}
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>TYPE</Text>
                        <View style={s.segRow}>
                            {[
                                { v: false, l: 'Annual Salary' },
                                { v: true, l: 'Hourly Rate' },
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
                        <Text style={s.fieldLabel}>{isHourly ? 'HOURLY RATE' : 'ANNUAL SALARY'}</Text>
                        <View style={s.dollarRow}>
                            <Text style={s.dollarSign}>$</Text>
                            <TextInput
                                style={[s.inp, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={C.t3}
                            />
                        </View>
                    </View>

                    {/* Hours */}
                    <View style={s.field}>
                        <Text style={s.fieldLabel}>HOURS PER WEEK</Text>
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
                            <Text style={s.previewLabel}>BLENDED RATE</Text>
                            <Text style={s.previewValue}>{fmt(hourlyRate)}<Text style={s.previewUnit}>/hr</Text></Text>
                        </View>
                    )}

                    {/* Save button */}
                    <AnimatedPressable
                        onPress={handleSave}
                        disabled={!canSave}
                        style={[s.saveBtn, { backgroundColor: canSave ? C.black : C.bgSub, opacity: canSave ? 1 : 0.5 }]}
                    >
                        <Text style={[s.saveBtnText, { color: canSave ? '#fff' : C.t3 }]}>
                            {existing ? 'Save Changes' : 'Add Income'}
                        </Text>
                    </AnimatedPressable>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: C.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: SP[4],
        paddingBottom: 32,
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignSelf: 'center', marginBottom: 16,
    },
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
        width: 32, height: 32, borderRadius: 16,
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
