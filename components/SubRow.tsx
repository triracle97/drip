import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import BrandLogo from './BrandLogo';

function IconContent({ icon, size = 22, useOriginalColor }: { icon: string; size?: number; useOriginalColor?: boolean }) {
    if (icon.startsWith('svg:')) {
        return <BrandLogo name={icon.slice(4)} size={size} color={useOriginalColor ? undefined : '#FFFFFF'} useOriginalColor={useOriginalColor} />;
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
        const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';
        return (
            <AnimatedPressable onPress={onPress} onLongPress={onLongPress} style={[s.card, isDragging && s.cardDragging]}>
                <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
                <View style={s.cardInner}>
                    <View style={isWhiteBg && s.iconShadow}>
                        <View style={[s.iconCircle, { backgroundColor: color }]}>
                            <IconContent icon={icon} size={22} useOriginalColor={isWhiteBg} />
                        </View>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={s.rowName} numberOfLines={1}>{name}</Text>
                            <View style={[s.trialBadge]}>
                                <Text style={s.trialBadgeText}>Trial</Text>
                            </View>
                        </View>
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
        const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';
        return (
            <AnimatedPressable onPress={onPress} style={[s.card, { opacity: 0.5 }]}>
                <View style={[s.stripe, { backgroundColor: `${color}66` }]} />
                <View style={s.cardInner}>
                    <View style={isWhiteBg && s.iconShadow}>
                        <View style={[s.iconCircle, { backgroundColor: color }]}>
                            <IconContent icon={icon} size={22} useOriginalColor={isWhiteBg} />
                        </View>
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

    return (
        <AnimatedPressable onPress={onPress} onLongPress={onLongPress} style={[s.card, isDragging && s.cardDragging]}>
            <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
            <View style={s.cardInner}>
                {/* Rounded icon with solid color background */}
                <View style={isWhiteBg && s.iconShadow}>
                    <View style={[s.iconCircle, { backgroundColor: color }]}>
                        <IconContent icon={icon} size={22} useOriginalColor={isWhiteBg} />
                    </View>
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
        width: 44,
        height: 44,
        borderRadius: R.sm,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    },
    iconShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: R.sm,
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
    trialBadge: {
        backgroundColor: `${C.red}12`,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: R.pill,
    },
    trialBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: C.red,
    },
});
