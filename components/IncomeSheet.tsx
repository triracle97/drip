import { C, R, SP } from '@/constants/design';
import { Income, useStore } from '@/store';
import { blended, fmt, subMo, toHrs } from '@/utils/calc';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
}

function IncomeRow({
    income,
    onEdit,
    onRemove,
}: {
    income: Income;
    onEdit: (i: Income) => void;
    onRemove: (id: string) => void;
}) {
    const weeklyRate = income.isHourly
        ? income.amount * (income.hoursPerWeek || 10)
        : income.amount / 52;

    return (
        <TouchableOpacity style={s.incRow} onPress={() => onEdit(income)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
                <Text style={s.incLabel}>{income.label || 'Income source'}</Text>
                <Text style={s.incSub}>
                    {income.isHourly
                        ? `${fmt(income.amount)}/hr · ${income.hoursPerWeek}h/wk`
                        : `${fmt(income.amount)}/yr · ${income.hoursPerWeek}h/wk`}
                </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.incRate}>{fmt(weeklyRate)}<Text style={s.incRateSub}>/wk</Text></Text>
            </View>
        </TouchableOpacity>
    );
}

function IncomeForm({
    initial,
    onSave,
    onCancel,
    onRemove,
}: {
    initial?: Income;
    onSave: (i: Omit<Income, 'id'>) => void;
    onCancel: () => void;
    onRemove?: () => void;
}) {
    const [label, setLabel] = useState(initial?.label ?? '');
    const [amount, setAmount] = useState(String(initial?.amount ?? ''));
    const [isHourly, setIsHourly] = useState(initial?.isHourly ?? false);
    const [hours, setHours] = useState(String(initial?.hoursPerWeek ?? 40));

    const canSave = label.trim() && parseFloat(amount) > 0;

    return (
        <View style={s.form}>
            <View style={s.formField}>
                <Text style={s.fieldLabel}>LABEL</Text>
                <TextInput
                    style={s.inp}
                    value={label}
                    onChangeText={setLabel}
                    placeholder="e.g. Full-time salary"
                    placeholderTextColor={C.t3}
                />
            </View>

            <View style={s.formField}>
                <Text style={s.fieldLabel}>TYPE</Text>
                <View style={s.segRow}>
                    {[
                        { v: false, l: 'Annual' },
                        { v: true, l: 'Hourly' },
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

            <View style={s.formField}>
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

            <View style={s.formField}>
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

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                    style={[s.btn, { flex: 2, backgroundColor: canSave ? C.black : C.bgSub, opacity: canSave ? 1 : 0.5 }]}
                    onPress={() => canSave && onSave({ label, amount: parseFloat(amount), isHourly, hoursPerWeek: parseInt(hours) || 40 })}
                    activeOpacity={0.85}
                    disabled={!canSave}
                >
                    <Text style={[s.btnLabel, { color: canSave ? '#fff' : C.t3 }]}>
                        {initial ? 'Save' : 'Add income'}
                    </Text>
                </TouchableOpacity>
                {onRemove && (
                    <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redLine }]} onPress={onRemove} activeOpacity={0.8}>
                        <Text style={[s.btnLabel, { color: C.red }]}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }} onPress={onCancel} activeOpacity={0.7}>
                <Text style={{ color: C.t3, fontSize: 14, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function IncomeSheet({ visible, onClose }: Props) {
    const { incomes, subs, addIncome, updateIncome, removeIncome } = useStore();
    const [editing, setEditing] = useState<Income | null>(null);
    const [adding, setAdding] = useState(false);

    const rate = blended(incomes);
    const totalMo = subs.filter(s => s.active && !s.isTrial).reduce((sum, s) => sum + subMo(s), 0);

    const handleAdd = (data: Omit<Income, 'id'>) => {
        addIncome({ ...data, id: `i${Date.now()}` });
        setAdding(false);
    };
    const handleUpdate = (data: Omit<Income, 'id'>) => {
        if (!editing) return;
        updateIncome({ ...data, id: editing.id });
        setEditing(null);
    };
    const handleRemove = (id: string) => {
        removeIncome(id);
        setEditing(null);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <View style={s.sheet}>
                    {/* Handle */}
                    <View style={s.handle} />

                    <Text style={s.title}>Income</Text>

                    {/* Headline rate */}
                    <View style={s.rateCard}>
                        <Text style={s.rateLabel}>BLENDED HOURLY RATE</Text>
                        <Text style={s.rateValue}>{fmt(rate)}<Text style={s.rateUnit}>/hr</Text></Text>
                        <Text style={s.rateSub}>Your subscriptions cost {toHrs(totalMo, rate)} of work/month</Text>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {(adding || editing) ? (
                            editing ? (
                                <IncomeForm
                                    initial={editing}
                                    onSave={handleUpdate}
                                    onCancel={() => setEditing(null)}
                                    onRemove={() => handleRemove(editing.id)}
                                />
                            ) : (
                                <IncomeForm onSave={handleAdd} onCancel={() => setAdding(false)} />
                            )
                        ) : (
                            <>
                                {incomes.map(i => (
                                    <IncomeRow key={i.id} income={i} onEdit={setEditing} onRemove={handleRemove} />
                                ))}
                                <TouchableOpacity style={s.addRow} onPress={() => setAdding(true)} activeOpacity={0.7}>
                                    <Text style={s.addRowLabel}>+ Add income source</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: C.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: SP[4],
        paddingBottom: 40,
        maxHeight: '85%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignSelf: 'center', marginBottom: 20,
    },
    title: {
        fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 16,
    },
    rateCard: {
        backgroundColor: C.bgSub,
        borderRadius: R.md,
        padding: SP[3],
        marginBottom: SP[3],
    },
    rateLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 4,
    },
    rateValue: {
        fontSize: 28, fontWeight: '700', color: C.t1,
    },
    rateUnit: {
        fontSize: 14, color: C.t3, fontWeight: '500',
    },
    rateSub: {
        fontSize: 12, color: C.t3, marginTop: 4,
    },
    incRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.line,
    },
    incLabel: {
        fontSize: 14, fontWeight: '600', color: C.t1,
    },
    incSub: {
        fontSize: 12, color: C.t3, marginTop: 2,
    },
    incRate: {
        fontSize: 16, fontWeight: '700', color: C.t1,
    },
    incRateSub: {
        fontSize: 11, color: C.t3, fontWeight: '400',
    },
    addRow: {
        paddingVertical: 16, alignItems: 'center',
    },
    addRowLabel: {
        fontSize: 14, fontWeight: '600', color: C.t2,
    },
    form: {
        paddingTop: 8,
    },
    formField: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 8,
    },
    inp: {
        backgroundColor: C.bgSub,
        borderRadius: R.md,
        padding: 14,
        fontSize: 16, fontWeight: '500', color: C.t1,
    },
    segRow: {
        flexDirection: 'row', backgroundColor: C.bgSub, borderRadius: R.pill, padding: 2,
    },
    seg: {
        flex: 1, paddingVertical: 8, borderRadius: R.pill, alignItems: 'center',
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
    btn: {
        paddingVertical: 15, borderRadius: R.pill, alignItems: 'center',
    },
    btnLabel: {
        fontSize: 14, fontWeight: '700',
    },
});
