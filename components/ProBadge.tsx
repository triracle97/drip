import { C, R } from '@/constants/design';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: 'sm' | 'md';
}

export default function ProBadge({ size = 'sm' }: Props) {
  const { t } = useTranslation();
  const isSm = size === 'sm';

  return (
    <View style={[s.badge, isSm ? s.badgeSm : s.badgeMd]}>
      <Svg width={isSm ? 8 : 10} height={isSm ? 8 : 10} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l2.09 6.26L20 9.27l-4.91 3.82L16.18 20 12 16.77 7.82 20l1.09-6.91L4 9.27l5.91-1.01L12 2z"
          fill={C.gold}
        />
      </Svg>
      <Text style={[s.text, isSm ? s.textSm : s.textMd]}>{t('pro.badge')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.warningBg,
    borderRadius: R.pill,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  text: {
    fontWeight: '700',
    color: C.gold,
  },
  textSm: {
    fontSize: 9,
  },
  textMd: {
    fontSize: 11,
  },
});
