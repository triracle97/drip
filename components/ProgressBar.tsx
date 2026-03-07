import { C, R } from '@/constants/design';
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
    progress: number;
    color?: string;
    height?: number;
    style?: ViewStyle;
}

export default function ProgressBar({ progress, color = C.green, height = 4, style }: Props) {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 600 });
    }, [progress]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${width.value * 100}%` as any,
        backgroundColor: color,
        height: '100%',
        borderRadius: height / 2,
    }));

    return (
        <View style={[s.track, { height, borderRadius: height / 2 }, style]}>
            <Animated.View style={fillStyle} />
        </View>
    );
}

const s = StyleSheet.create({
    track: {
        backgroundColor: C.bgSub,
        overflow: 'hidden',
    },
});
