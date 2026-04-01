import ProBadge from '@/components/ProBadge';
import { C, R } from '@/constants/design';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
}

export default function ProBlurOverlay({ onPress, children }: Props) {
  return (
    <View style={s.container}>
      <View style={s.content} pointerEvents="none">
        {children}
      </View>
      <TouchableOpacity style={s.overlay} onPress={onPress} activeOpacity={0.85}>
        <View style={s.lockGroup}>
          <View style={s.lockCircle}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4"
                stroke={C.gold}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <ProBadge size="md" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: R.md,
  },
  content: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.md,
  },
  lockGroup: {
    alignItems: 'center',
    gap: 6,
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
