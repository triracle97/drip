import { C, R } from '@/constants/design';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ProFeatureKey = 'subs' | 'insights' | 'calendar' | 'trial' | 'categories';

interface Props {
  feature: ProFeatureKey | null;
  onClose: () => void;
  onPurchased?: () => void;
}

export default function ProSheet({ feature, onClose, onPurchased }: Props) {
  const { t } = useTranslation();
  const { currentOffering, purchasePackage, restorePurchases } = useRevenueCat();
  const sheetRef = useRef<TrueSheet>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feature) {
      const timer = setTimeout(() => {
        sheetRef.current?.present().catch(() => {});
      }, 50);
      return () => clearTimeout(timer);
    } else {
      sheetRef.current?.dismiss().catch(() => {});
    }
  }, [feature]);

  const handlePurchase = async () => {
    const pack = currentOffering?.availablePackages[0];
    if (!pack) return;
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      sheetRef.current?.dismiss().catch(() => {});
      onPurchased?.();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  return (
    <TrueSheet
      ref={sheetRef}
      sizes={['auto']}
      cornerRadius={24}
      onDismiss={onClose}
      grabber={false}
    >
      <View style={s.content}>
        <View style={s.iconCircle}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2l2.09 6.26L20 9.27l-4.91 3.82L16.18 20 12 16.77 7.82 20l1.09-6.91L4 9.27l5.91-1.01L12 2z"
              fill={C.gold}
            />
          </Svg>
        </View>

        <Text style={s.headline}>
          {feature ? t(`pro.headline.${feature}`) : ''}
        </Text>
        <Text style={s.desc}>
          {feature ? t(`pro.desc.${feature}`) : ''}
        </Text>

        <TouchableOpacity
          style={s.ctaBtn}
          onPress={handlePurchase}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.ctaText}>{t('pro.priceOnce')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={s.restoreText}>{t('pro.restorePurchase')}</Text>
        </TouchableOpacity>
      </View>
    </TrueSheet>
  );
}

const s = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: C.t2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  ctaBtn: {
    backgroundColor: C.black,
    borderRadius: R.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  restoreBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    color: C.t3,
  },
});
