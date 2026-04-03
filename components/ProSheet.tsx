import { C } from '@/constants/design';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export type ProFeatureKey = 'subs' | 'insights' | 'calendar' | 'trial' | 'categories' | 'customSub';

interface Props {
  feature: ProFeatureKey | null;
  onClose: () => void;
  onPurchased?: () => void;
}

// Placeholder for future Lottie animation

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
      detents={['auto']}
      cornerRadius={32}
      onDidDismiss={onClose}
      grabber={false}
    >
      <View style={s.content}>
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
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 16,
    color: C.t2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  ctaBtn: {
    backgroundColor: '#177b9c',
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#177b9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  restoreBtn: {
    marginTop: 20,
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.t3,
  },
});
