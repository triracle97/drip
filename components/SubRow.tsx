import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import BrandLogo from './BrandLogo';

function IconContent({ icon, size = 18, color, useOriginalColor }: { icon: string; size?: number; color?: string; useOriginalColor?: boolean }) {
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
    hoursLabel?: string;
    urgent?: boolean;
    onPress?: () => void;
    variant?: 'default' | 'trial' | 'inactive';
    trialDaysLeft?: number;
    trialCostLabel?: string;
}

export default function SubRow({
    name, icon, color, costLabel, costSub, renewLabel, hoursLabel,
    urgent, onPress, variant = 'default', trialDaysLeft, trialCostLabel,
}: Props) {

    // ── Trial Card ──
    if (variant === 'trial') {
        return (
            <AnimatedPressable onPress={onPress} style={s.card}>
                <View style={[s.stripe, { backgroundColor: C.red }]} />
                <View style={s.cardInner}>
                    <View style={[s.iconSquare, { backgroundColor: color }]}>
                        <IconContent icon={icon} size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={s.topRow}>
                            <Text style={s.rowName}>{name}</Text>
                            <View style={s.rightCol}>
                                <Text style={s.rowCost}>{costLabel}</Text>
                            </View>
                        </View>
                        <View style={s.bottomRow}>
                            {trialCostLabel && <Text style={s.metaText}>{trialCostLabel}</Text>}
                            <View style={[s.pill, { backgroundColor: `${C.red}18` }]}>
                                <Text style={[s.pillText, { color: C.red }]}>{trialDaysLeft}d left</Text>
                            </View>
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
                    <View style={[s.iconSquare, { backgroundColor: `${color}66` }]}>
                        <IconContent icon={icon} size={18} color="#FFFFFF" />
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
    const normalPillBg = isWhiteBg ? `${C.t3}10` : `${color}10`;

    return (
        <AnimatedPressable onPress={onPress} style={s.card}>
            <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />

            <View style={s.cardInner}>
                {/* Brand-colored circle + white monochrome logo */}
                <View style={[s.iconSquare, { backgroundColor: color }, isWhiteBg && s.iconSquareShadow]}>
                    <IconContent icon={icon} size={18} color={isWhiteBg ? undefined : '#FFFFFF'} useOriginalColor={isWhiteBg} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    {/* Top: name + cost */}
                    <View style={s.topRow}>
                        <Text style={s.rowName}>{name}</Text>
                        <View style={s.rightCol}>
                            <Text style={s.rowCost}>{costLabel}</Text>
                            {costSub && <Text style={s.rowCostSub}>{costSub}</Text>}
                        </View>
                    </View>

                    {/* Bottom: renew + hours */}
                    <View style={s.bottomRow}>
                        {hoursLabel && (
                            <Text style={s.metaText}>{hoursLabel}</Text>
                        )}
                        {renewLabel && (
                            <View style={[s.pill, { backgroundColor: urgent ? urgentPillBg : normalPillBg }]}>
                                <Text style={[s.pillText, { color: urgent ? C.red : C.t2 }]}>{renewLabel}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </AnimatedPressable>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.surfaceElevated,
        borderRadius: R.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        overflow: 'hidden',
        marginBottom: 8,
        ...SHADOW.card,
    },
    stripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: R.md,
        borderBottomLeftRadius: R.md,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        paddingLeft: 14, // extra for stripe
    },
    iconSquare: {
        width: 40,
        height: 40,
        borderRadius: R.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconSquareShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    rightCol: {
        alignItems: 'flex-end',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    rowName: {
        fontSize: 14,
        fontWeight: '700',
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
    metaText: {
        fontSize: 12,
        fontWeight: '500',
        color: C.t3,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: R.pill,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
