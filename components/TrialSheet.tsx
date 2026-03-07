import { C, R, SP } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { blended, fmt, subMo, toHrs } from '@/utils/calc';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Props {
    sub: Sub | null;
    onClose: () => void;
}

export default function TrialSheet({ sub: t, onClose }: Props) {
    const { incomes, decideTrial } = useStore();
    const rate = blended(incomes);
    const today = new Date();
    const curDay = today.getDate();

    if (!t) return null;

    const mc = subMo(t);
    const daysLeft = t.trialEndDay - curDay;
    const pct = Math.max(0, Math.min(1, 1 - daysLeft / 14));
    const circumference = 2 * Math.PI * 16;

    const handleDecide = (decision: 'kept' | 'cancelled') => {
        decideTrial(t.id, decision);
        onClose();
    };

    return (
        <Modal visible={!!t} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <View style={s.sheet}>
                    {/* Handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.header}>
                        <View style={[s.iconBox, { backgroundColor: t.color || '#000' }]}>
                            <Text style={{ fontSize: 18 }}>{t.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.name}>{t.name}</Text>
                            <Text style={s.trialBadge}>Trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Text>
                        </View>
                        {/* Countdown ring */}
                        <Svg width={48} height={48} viewBox="0 0 40 40">
                            <Circle cx={20} cy={20} r={16} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
                            <Circle
                                cx={20} cy={20} r={16}
                                fill="none"
                                stroke={daysLeft <= 3 ? C.red : C.t2}
                                strokeWidth={3}
                                strokeDasharray={`${pct * circumference} ${circumference}`}
                                strokeLinecap="round"
                                rotation={-90}
                                originX={20}
                                originY={20}
                            />
                            <SvgText
                                x={20} y={21}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={daysLeft <= 3 ? C.red : C.t1}
                                fontSize={11}
                                fontWeight="700"
                            >
                                {daysLeft}
                            </SvgText>
                        </Svg>
                    </View>

                    {/* Cost card */}
                    <View style={s.costCard}>
                        <Text style={s.costCardLabel}>IF YOU KEEP THIS</Text>
                        <Text style={s.costHours}>{toHrs(mc, rate)} of work/month</Text>
                        <Text style={s.costMeta}>{fmt(mc)}/month · {fmt(mc * 12)}/year</Text>
                    </View>

                    {/* Reflection */}
                    <View style={s.reflectCard}>
                        <Text style={s.reflectText}>
                            Have you used <Text style={s.reflectBold}>{t.name}</Text> enough in the trial period to justify{' '}
                            <Text style={s.reflectBold}>{toHrs(mc, rate)}</Text> of work every month?
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[s.actionBtn, { flex: 1, backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redLine }]}
                            onPress={() => handleDecide('cancelled')}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.actionLabel, { color: C.red }]}>Cancel — not worth it</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.actionBtn, { flex: 1, backgroundColor: C.black }]}
                            onPress={() => handleDecide('kept')}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.actionLabel, { color: '#fff' }]}>Keep — worth it</Text>
                        </TouchableOpacity>
                    </View>
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
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignSelf: 'center', marginBottom: 20,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    },
    iconBox: {
        width: 52, height: 52, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    name: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    trialBadge: {
        fontSize: 12, color: C.red, fontWeight: '600', marginTop: 2,
    },
    costCard: {
        backgroundColor: C.bgSub,
        borderRadius: R.md,
        padding: SP[3],
        marginBottom: 12,
    },
    costCardLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 4,
    },
    costHours: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    costMeta: {
        fontSize: 12, color: C.t3, marginTop: 4,
    },
    reflectCard: {
        backgroundColor: C.bgSub,
        borderRadius: R.md,
        padding: SP[3],
        marginBottom: 24,
    },
    reflectText: {
        fontSize: 12, color: C.t2, lineHeight: 18,
    },
    reflectBold: {
        color: C.t1, fontWeight: '700',
    },
    actionBtn: {
        paddingVertical: 15, borderRadius: R.md, alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14, fontWeight: '600',
    },
});
