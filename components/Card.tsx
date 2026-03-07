import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    tintColor?: string;
    elevated?: boolean;
}

export default function Card({ children, style, tintColor, elevated }: Props) {
    return (
        <View
            style={[
                s.card,
                elevated ? SHADOW.cardHover : SHADOW.card,
                tintColor ? { backgroundColor: tintColor } : undefined,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.surfaceElevated,
        borderRadius: R.md,
        padding: 16,
    },
});
