import { C, R } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface Props {
    label: string;
    color: string;
    icon?: string;
    amount?: string;
    selected?: boolean;
    onPress?: () => void;
    style?: ViewStyle;
}

export default function CategoryPill({ label, color, icon, amount, selected, onPress, style }: Props) {
    return (
        <AnimatedPressable
            onPress={onPress}
            style={[
                s.pill,
                {
                    backgroundColor: selected ? `${color}18` : C.surface,
                    borderColor: selected ? `${color}55` : C.line,
                },
                style,
            ]}
        >
            {icon ? (
                <Text style={{ fontSize: 13 }}>{icon}</Text>
            ) : (
                <View style={[s.dot, { backgroundColor: color }]} />
            )}
            <Text style={[s.label, { color: selected ? color : C.t2 }]}>{label}</Text>
            {amount != null && (
                <Text style={[s.amount, { color: selected ? `${color}AA` : C.t3 }]}>{amount}</Text>
            )}
        </AnimatedPressable>
    );
}

const s = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: R.pill,
        borderWidth: 1.5,
        flexShrink: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
    },
    amount: {
        fontSize: 12,
    },
});
