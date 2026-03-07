import { C, R } from '@/constants/design';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
    message: string | null;
}

export default function Toast({ message }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (message) {
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.delay(1600),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [message]);

    if (!message) return null;

    return (
        <Animated.View style={[s.toast, { opacity }]}>
            <Text style={s.text}>{message}</Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        backgroundColor: C.bgSub,
        borderRadius: R.md,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: C.line,
        zIndex: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    text: {
        fontSize: 12, fontWeight: '500', color: C.t1,
    },
});
