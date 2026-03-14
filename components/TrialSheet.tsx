import AnimatedPressable from '@/components/AnimatedPressable';
import BrandLogo from '@/components/BrandLogo';
import Card from '@/components/Card';
import { C, R, SP } from '@/constants/design';
import { Sub, useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { blended, fmt, subMo, toHrs } from '@/utils/calc';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Props {
    sub: Sub | null;
    onClose: () => void;
}

export default function TrialSheet({ sub: t, onClose }: Props) {
    const { t: i18n } = useTranslation();
    const { incomes, decideTrial } = useStore();
    const currency = useSettings(s => s.currency);
    const rate = blended(incomes);
    const today = new Date();
    const curDay = today.getDate();
    const sheetRef = useRef<TrueSheet>(null);

    useEffect(() => {
        if (t) {
            const timer = setTimeout(() => {
                sheetRef.current?.present().catch(() => { });
            }, 50);
            return () => clearTimeout(timer);
        } else {
            sheetRef.current?.dismiss().catch(() => { });
        }
    }, [t]);

    const mc = t ? subMo(t) : 0;
    const daysLeft = t ? t.trialEndDay - curDay : 0;
    const pct = Math.max(0, Math.min(1, 1 - daysLeft / 14));
    const circumference = 2 * Math.PI * 16;

    const handleDecide = (decision: 'kept' | 'cancelled') => {
        if (!t) return;
        decideTrial(t.id, decision);
        sheetRef.current?.dismiss().catch(() => { });
    };

    const handleDismissed = () => {
        onClose();
    };

    const isWhite = t ? (t.color?.toUpperCase() === '#FFFFFF' || t.color?.toUpperCase() === '#FFF') : false;

    return (
        <TrueSheet
            ref={sheetRef}
            detents={['auto']}
            grabber={false}
            cornerRadius={24}
            dismissible={true}
            dimmed={true}
            dimmedDetentIndex={0}
            backgroundColor={C.bg}
            onDidDismiss={handleDismissed}
        >
            {/* Custom grabber */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', width: 40, height: 4, borderRadius: 99, marginTop: 8, marginBottom: 4 }} />
            </View>

            {/* Header */}
            <View style={s.content}>
                <View style={s.header}>
                    <View style={[s.iconBox, { backgroundColor: t?.color || '#000' }, isWhite && s.iconBoxShadow]}>
                        {t?.icon.startsWith('svg:')
                            ? <BrandLogo name={t.icon.slice(4)} size={22} color={isWhite ? undefined : '#FFFFFF'} useOriginalColor={isWhite} />
                            : <Text style={{ fontSize: 22 }}>{t?.icon ?? '📦'}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.name}>{t?.name}</Text>
                        <Text style={s.trialBadge}>{i18n('trial.endsIn', { count: daysLeft })}</Text>
                    </View>
                    {/* Countdown ring */}
                    <Svg width={48} height={48} viewBox="0 0 40 40">
                        <Circle cx={20} cy={20} r={16} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
                        <Circle
                            cx={20} cy={20} r={16}
                            fill="none"
                            stroke={daysLeft <= 3 ? C.red : C.t2}
                            strokeWidth={3}
                            strokeDasharray={`${pct * circumference} ${circumference}`}
                            strokeLinecap="round"
                            rotation={-90}
                            originX={20}
                            originY={20}
                        />
                        <SvgText
                            x={20} y={24}
                            textAnchor="middle"
                            fill={daysLeft <= 3 ? C.red : C.t1}
                            fontSize={11}
                            fontWeight="700"
                        >
                            {daysLeft}
                        </SvgText>
                    </Svg>
                </View>

                {/* Current cost */}
                <Card style={s.costCard}>
                    <Text style={s.costCardLabel}>RIGHT NOW</Text>
                    <Text style={s.costHours}>{fmt(0)}/month</Text>
                    <Text style={s.costMeta}>Free during trial · {i18n('trial.endsIn', { count: daysLeft })}</Text>
                </Card>

                {/* After trial cost */}
                <Card style={s.costCard}>
                    <Text style={s.costCardLabel}>AFTER TRIAL</Text>
                    <Text style={s.costHours}>{toHrs(mc, rate)} of work/month</Text>
                    <Text style={s.costMeta}>{fmt(mc)}/month · {fmt(mc * 12)}/year</Text>
                </Card>

                {/* Reflection */}
                <Card style={s.reflectCard}>
                    <Text style={s.reflectText}>
                        Have you used <Text style={s.reflectBold}>{t?.name}</Text> enough in the trial period to justify{' '}
                        <Text style={s.reflectBold}>{toHrs(mc, rate)}</Text> of work every month?
                    </Text>
                </Card>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <AnimatedPressable
                        style={[s.actionBtn, { flex: 1, backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redLine }]}
                        onPress={() => handleDecide('cancelled')}
                    >
                        <Text style={[s.actionLabel, { color: C.red }]}>{i18n('trial.cancelSubscription')}</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={[s.actionBtn, { flex: 1, backgroundColor: C.black }]}
                        onPress={() => handleDecide('kept')}
                    >
                        <Text style={[s.actionLabel, { color: '#fff' }]}>{i18n('trial.keepSubscription')}</Text>
                    </AnimatedPressable>
                </View>
            </View>
        </TrueSheet>
    );
}

const s = StyleSheet.create({
    content: {
        paddingHorizontal: SP[4],
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 12,
    },
    iconBox: {
        width: 52, height: 52, borderRadius: R.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    iconBoxShadow: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    name: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    trialBadge: {
        fontSize: 12, color: C.red, fontWeight: '600', marginTop: 2,
    },
    costCard: {
        marginBottom: 12,
    },
    costCardLabel: {
        fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, marginBottom: 4,
    },
    costHours: {
        fontSize: 18, fontWeight: '700', color: C.t1,
    },
    costMeta: {
        fontSize: 12, color: C.t3, marginTop: 4,
    },
    reflectCard: {
        marginBottom: 24,
    },
    reflectText: {
        fontSize: 12, color: C.t2, lineHeight: 18,
    },
    reflectBold: {
        color: C.t1, fontWeight: '700',
    },
    actionBtn: {
        paddingVertical: 15, borderRadius: R.md, alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14, fontWeight: '600',
    },
});
