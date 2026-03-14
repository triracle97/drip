import AnimatedPressable from '@/components/AnimatedPressable';
import BrandLogo from '@/components/BrandLogo';
import { C, R, SHADOW } from '@/constants/design';
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

function IconContent({ icon, useOriginalColor }: { icon: string; useOriginalColor?: boolean }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={14} color={useOriginalColor ? undefined : '#FFFFFF'} useOriginalColor={useOriginalColor} />;
  }
  return <Text style={{ fontSize: 12 }}>{icon}</Text>;
}

export default function UpcomingChargeCompact({ name, icon, color, daysLeft, cost, onPress }: Props) {
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
    width: 28, height: 28, borderRadius: R.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  iconShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
    borderRadius: R.sm,
  },
  name: { fontSize: 12, fontWeight: '700', color: C.t1 },
  meta: { fontSize: 10, color: C.t3 },
});
