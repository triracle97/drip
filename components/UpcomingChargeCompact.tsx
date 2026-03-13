import AnimatedPressable from '@/components/AnimatedPressable';
import BrandLogo from '@/components/BrandLogo';
import { C, SHADOW } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  icon: string;
  color: string;
  daysLeft: number;
  cost: string;
  onPress: () => void;
}

function IconContent({ icon }: { icon: string }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={14} useOriginalColor />;
  }
  return <Text style={{ fontSize: 12 }}>{icon}</Text>;
}

export default function UpcomingChargeCompact({ name, icon, color, daysLeft, cost, onPress }: Props) {
  const isWhiteBg = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF';
  const iconBg = isWhiteBg ? '#F5F5F5' : `${color}15`;

  return (
    <AnimatedPressable onPress={onPress} style={s.card}>
      <View style={[s.stripe, { backgroundColor: isWhiteBg ? C.line : color }]} />
      <View style={s.inner}>
        <View style={[s.iconCircle, { backgroundColor: iconBg }, isWhiteBg && s.iconBorder]}>
          <IconContent icon={icon} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <Text style={s.meta}>{daysLeft}d · {cost}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...SHADOW.card,
  },
  stripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, paddingLeft: 14,
  },
  iconCircle: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBorder: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  name: { fontSize: 12, fontWeight: '700', color: C.t1 },
  meta: { fontSize: 10, color: C.t3 },
});
