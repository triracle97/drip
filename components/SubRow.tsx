import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import BrandLogo from './BrandLogo';

function IconContent({ icon, size = 22, color, useOriginalColor }: { icon: string; size?: number; color?: string; useOriginalColor?: boolean }) {
    if (icon.startsWith('svg:')) {
        return <BrandLogo name={icon.slice(4)} size={size} color={useOriginalColor ? undefined : color} useOriginalColor={useOriginalColor} />;
    }
    return <Text style={{ fontSize: size }}>{icon}</Text>;
}

interface Props {
    name: string;
    icon: string;
    color: string;
    costLabel: string;
    costSub?: string;
    renewLabel?: string;
    dateLabel?: string;
    hoursLabel?: string;
    urgent?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    isDragging?: boolean;
    variant?: 'default' | 'trial' | 'inactive';
    trialDaysLeft?: number;
    trialCostLabel?: string;
}

export default function SubRow({
    name, icon, color, costLabel, costSub, renewLabel, dateLabel, hoursLabel,
    urgent, onPress, onLongPress, isDragging, variant = 'default', trialDaysLeft, trialCostLabel,
}: Props) {

    // ── Trial Card ──
    if (variant === 'trial') {
        return (
            <AnimatedPressable onPress={onPress} style={s.card}>
                <View style={[s.stripe, { backgroundColor: C.red }]} />
                <View style={s.cardInner}>
                    <View style={[s.iconCircle, { backgroundColor: `${color}18` }]}>
                        <IconContent icon={icon} size={22} color={color} useOriginalColor />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.rowName} numberOfLines={1}>{name}</Text>
                        {trialCostLabel && <Text style={s.dateText}>{trialCostLabel}</Text>}
                    </View>
                    <View style={s.rightCol}>
                        <Text style={s.rowCost}>{costLabel}</Text>
                        <View style={[s.pill, { backgroundColor: `${C.red}18` }]}>
                            <Text style={[s.pillText, { color: C.red }]}>{trialDaysLeft}d left</Text>
                        </View>
                    </View>
                </View>
            </AnimatedPressable>
        );
    }

    // ── Inactive Card ──
    if (variant === 'inactive') {
        return (
            <AnimatedPressable onPress={onPress} style={[s.card, { opacity: 0.5 }]}>
                <View style={[s.stripe, { backgroundColor: `${color}66` }]} />
                <View style={s.cardInner}>
                    <View style={[s.iconCircle, { backgroundColor: `${color}12` }]}>
                        <IconContent icon={icon} size={22} color={`${color}88`} useOriginalColor />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.rowName, { textDecorationLine: 'line-through', color: C.t2 }]}>{name}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: C.t3, fontWeight: '500' }}>was {costLabel}</Text>
                </View>
            </AnimatedPressable>
        );
    }

    // ── Default Card ──
    const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';
    const urgentPillBg = `${C.red}18`;
    const normalPillBg = isWhiteBg ? `${C.t3}15` : `${color}15`;
    const iconBg = isWhiteBg ? '#F5F5F5' : `${color}15`;

    return (
        <AnimatedPressable onPress={onPress} onLongPress={onLongPress} style={[s.card, isDragging && s.cardDragging]}>
            <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
            <View style={s.cardInner}>
                {/* Rounded icon with tinted background */}
                <View style={[s.iconCircle, { backgroundColor: iconBg }, isWhiteBg && s.iconCircleBorder]}>
                    <IconContent icon={icon} size={22} color={isWhiteBg ? undefined : color} useOriginalColor={isWhiteBg} />
                </View>

                {/* Name + date */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowName} numberOfLines={1}>{name}</Text>
                    {dateLabel && <Text style={s.dateText}>{dateLabel}</Text>}
                </View>

                {/* Cost + renew pill */}
                <View style={s.rightCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={s.rowCost}>{costLabel}</Text>
                    </View>
                    {renewLabel && (
                        <View style={[s.pill, { backgroundColor: urgent ? urgentPillBg : normalPillBg }]}>
                            <Text style={[s.pillText, { color: urgent ? C.red : C.t2 }]}>{renewLabel}</Text>
                        </View>
                    )}
                </View>
            </View>
        </AnimatedPressable>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.surfaceElevated,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        overflow: 'hidden',
        marginBottom: 8,
        ...SHADOW.card,
    },
    cardDragging: {
        ...SHADOW.cardHover,
        borderColor: 'rgba(0,0,0,0.08)',
        opacity: 0.95,
    },
    stripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconCircleBorder: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    rightCol: {
        alignItems: 'flex-end',
        gap: 4,
    },
    rowName: {
        fontSize: 15,
        fontWeight: '700',
        color: C.t1,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '400',
        color: C.t3,
        marginTop: 2,
    },
    rowCost: {
        fontSize: 16,
        fontWeight: '700',
        color: C.t1,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: R.pill,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
