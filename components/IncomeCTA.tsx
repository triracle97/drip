import AnimatedPressable from '@/components/AnimatedPressable';
import { C, R } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

interface Props {
    onPress: () => void;
}

export default function IncomeCTA({ onPress }: Props) {
    const { t } = useTranslation();
    return (
        <AnimatedPressable onPress={onPress} style={s.container}>
            <View style={s.icon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={C.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
            <Text style={s.text}>{t('incomeCta.message')}</Text>
            <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                <Path d="M6 3l5 5-5 5" stroke={C.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </AnimatedPressable>
    );
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.greenBg,
        borderRadius: R.md,
        borderWidth: 1,
        borderColor: C.greenLine,
        padding: 12,
        marginBottom: 16,
    },
    icon: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
    },
    text: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: C.green,
    },
});
