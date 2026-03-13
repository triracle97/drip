import AnimatedPressable from '@/components/AnimatedPressable';
import BrandLogo from '@/components/BrandLogo';
import { C, R, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

function IconContent({ icon, color }: { icon: string; color: string }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={22} useOriginalColor />;
  }
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

export default function UpcomingChargeHero({ name, icon, color, cost, date, daysLeft, hoursLabel, onPress }: Props) {
  const urgent = daysLeft <= 3;
  const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';
  const iconBg = isWhiteBg ? '#F5F5F5' : `${color}15`;

  return (
    <AnimatedPressable onPress={onPress} style={s.card}>
      <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
      <View style={s.inner}>
        <View style={[s.iconCircle, { backgroundColor: iconBg }, isWhiteBg && s.iconBorder]}>
          <IconContent icon={icon} color={color} />
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
              {daysLeft <= 1 ? 'Tomorrow' : `${daysLeft} days`}
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
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBorder: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  name: { fontSize: 15, fontWeight: '700', color: C.t1 },
  date: { fontSize: 13, color: C.t3, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  cost: { fontSize: 16, fontWeight: '700', color: C.t1 },
  hours: { fontSize: 11, fontWeight: '500', color: C.t2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
});
