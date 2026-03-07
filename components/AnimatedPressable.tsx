import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props extends TouchableOpacityProps {
    children: React.ReactNode;
    scaleDown?: number;
}

export default function AnimatedPressable({ children, scaleDown = 0.97, style, ...rest }: Props) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedTouchable
            {...rest}
            style={[animatedStyle, style]}
            activeOpacity={0.85}
            onPressIn={(e) => {
                scale.value = withSpring(scaleDown, { damping: 15, stiffness: 300 });
                rest.onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withSpring(1, { damping: 15, stiffness: 300 });
                rest.onPressOut?.(e);
            }}
        >
            {children}
        </AnimatedTouchable>
    );
}
