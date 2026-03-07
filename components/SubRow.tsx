import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import ProgressBar from './ProgressBar';

interface Props {
    name: string;
    icon: string;
    color: string;
    costLabel: string;
    costSub?: string;
    renewLabel?: string;
    hoursLabel?: string;
    progress?: number;
    urgent?: boolean;
    onPress?: () => void;
    variant?: 'default' | 'trial' | 'inactive';
    trialDaysLeft?: number;
    trialCostLabel?: string;
}

export default function SubRow({
    name, icon, color, costLabel, costSub, renewLabel, hoursLabel,
    progress, urgent, onPress, variant = 'default', trialDaysLeft, trialCostLabel,
}: Props) {
    if (variant === 'trial') {
        return (
            <AnimatedPressable onPress={onPress} style={s.trialRow}>
                <View style={[s.iconCircle, { backgroundColor: color }]}>
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={s.rowName}>{name}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: C.red }}>
                            {trialDaysLeft}d left
                        </Text>
                    </View>
                    {progress != null && <ProgressBar progress={progress} color={C.red} />}
                    {trialCostLabel && <Text style={s.rowMeta}>{trialCostLabel}</Text>}
                </View>
            </AnimatedPressable>
        );
    }

    if (variant === 'inactive') {
        return (
            <AnimatedPressable onPress={onPress} style={[s.row, { opacity: 0.4 }]}>
                <View style={[s.iconCircle, { backgroundColor: `${color}33`, borderRadius: R.md }]}>
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: C.t2, textDecorationLine: 'line-through' }}>{name}</Text>
                </View>
                <Text style={{ fontSize: 12, color: C.t3 }}>was {costLabel}</Text>
            </AnimatedPressable>
        );
    }

    return (
        <AnimatedPressable onPress={onPress} style={s.row}>
            <View style={[s.iconCircle, { backgroundColor: color }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={s.rowName}>{name}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.rowCost}>{costLabel}</Text>
                        {costSub && <Text style={s.rowCostSub}>{costSub}</Text>}
                    </View>
                </View>
                {progress != null && (
                    <ProgressBar progress={progress} color={urgent ? C.red : color} />
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    {renewLabel && (
                        <Text style={[s.rowRenew, { color: urgent ? C.red : 'rgba(0,0,0,0.24)' }]}>
                            {renewLabel}
                        </Text>
                    )}
                    {hoursLabel && (
                        <Text style={s.rowHours}>{hoursLabel}</Text>
                    )}
                </View>
            </View>
        </AnimatedPressable>
    );
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.line,
    },
    trialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.redBg,
        borderWidth: 1,
        borderColor: C.redLine,
        borderRadius: R.sm,
        padding: 12,
        marginBottom: 4,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: R.pill,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowName: {
        fontSize: 14,
        fontWeight: '600',
        color: C.t1,
    },
    rowCost: {
        fontSize: 14,
        fontWeight: '700',
        color: C.t1,
    },
    rowCostSub: {
        fontSize: 10,
        fontWeight: '500',
        color: C.t3,
    },
    rowRenew: {
        fontSize: 12,
        fontWeight: '600',
    },
    rowMeta: {
        fontSize: 12,
        color: C.t3,
        marginTop: 4,
    },
    rowHours: {
        fontSize: 12,
        fontWeight: '600',
        color: C.t2,
    },
});
