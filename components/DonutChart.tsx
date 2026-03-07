import { C } from '@/constants/design';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Slice {
    value: number;
    color: string;
}

interface Props {
    slices: Slice[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerSub?: string;
}

export default function DonutChart({ slices, size = 140, strokeWidth = 14, centerLabel, centerSub }: Props) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    const cx = size / 2;
    const cy = size / 2;

    let accumulated = 0;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background ring */}
                <Circle
                    cx={cx} cy={cy} r={radius}
                    fill="none" stroke={C.bgSub} strokeWidth={strokeWidth}
                />
                {/* Slices */}
                {total > 0 && slices.map((sl, i) => {
                    const pct = sl.value / total;
                    const dash = pct * circumference;
                    const gap = circumference - dash;
                    const offset = -accumulated * circumference - circumference * 0.25; // start at top
                    accumulated += pct;
                    return (
                        <Circle
                            key={i}
                            cx={cx} cy={cy} r={radius}
                            fill="none"
                            stroke={sl.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                        />
                    );
                })}
                {/* Center text */}
                {centerLabel && (
                    <SvgText
                        x={cx} y={centerSub ? cy - 6 : cy + 4}
                        textAnchor="middle"
                        fill={C.t1}
                        fontSize={18}
                        fontWeight="800"
                    >
                        {centerLabel}
                    </SvgText>
                )}
                {centerSub && (
                    <SvgText
                        x={cx} y={cy + 14}
                        textAnchor="middle"
                        fill={C.t3}
                        fontSize={10}
                        fontWeight="500"
                    >
                        {centerSub}
                    </SvgText>
                )}
            </Svg>
        </View>
    );
}
