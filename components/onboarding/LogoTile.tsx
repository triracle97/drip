import BrandLogo from '@/components/BrandLogo';
import { C } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const isWhite = (c: string) => ['#FFF', '#FFFFFF'].includes(c.toUpperCase());

/** Rounded brand tile: brand-colored square with a white logo (outlined for white brands). */
export default function LogoTile({ icon, color, size = 48 }: { icon: string; color: string; size?: number }) {
  const white = isWhite(color);
  const radius = Math.round(size * 0.28);
  return (
    <View
      style={[
        s.tile,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
        white && s.whiteTile,
      ]}
    >
      {icon.startsWith('svg:') ? (
        <BrandLogo
          name={icon.slice(4)}
          size={Math.round(size * 0.52)}
          color={white ? undefined : '#FFFFFF'}
          useOriginalColor={white}
        />
      ) : (
        <Text style={{ fontSize: Math.round(size * 0.45) }}>{icon}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  whiteTile: { borderWidth: 1, borderColor: C.line },
});
