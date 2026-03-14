import AnimatedPressable from '@/components/AnimatedPressable';
import BrandLogo from '@/components/BrandLogo';
import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  name: string;
  icon: string;
  color: string;
  cost: string;
  date: string;
  daysLeft: number;
  hoursLabel: string;
  onPress: () => void;
}

function IconContent({ icon, useOriginalColor }: { icon: string; useOriginalColor?: boolean }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={22} color={useOriginalColor ? undefined : '#FFFFFF'} useOriginalColor={useOriginalColor} />;
  }
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

export default function UpcomingChargeHero({ name, icon, color, cost, date, daysLeft, hoursLabel, onPress }: Props) {
  const { t } = useTranslation();
  const urgent = daysLeft <= 3;
  const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';

  return (
    <AnimatedPressable onPress={onPress} style={s.card}>
      <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
      <View style={s.inner}>
        <View style={isWhiteBg && s.iconShadow}>
          <View style={[s.iconCircle, { backgroundColor: color }]}>
            <IconContent icon={icon} useOriginalColor={isWhiteBg} />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <Text style={s.date}>{date}</Text>
        </View>
        <View style={s.rightCol}>
          <Text style={s.cost}>{cost}</Text>
          <Text style={s.hours}>{hoursLabel}</Text>
          <View style={[s.pill, { backgroundColor: urgent ? `${C.red}18` : `${color}15` }]}>
            <Text style={[s.pillText, { color: urgent ? C.red : C.t2 }]}>
              {daysLeft <= 1 ? t('upcoming.tomorrow') : t('upcoming.days', { count: daysLeft })}
            </Text>
          </View>
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
    ...SHADOW.card,
  },
  stripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: R.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  iconShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
    borderRadius: R.sm,
  },
  name: { fontSize: 15, fontWeight: '700', color: C.t1 },
  date: { fontSize: 13, color: C.t3, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  cost: { fontSize: 16, fontWeight: '700', color: C.t1 },
  hours: { fontSize: 11, fontWeight: '500', color: C.t2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
});
