import { C, R } from '@/constants/design';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useSettings } from '@/store/settings';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const FEATURES = [
  'pro.feature.unlimitedSubs',
  'pro.feature.fullInsights',
  'pro.feature.fullCalendar',
  'pro.feature.trialTracking',
  'pro.feature.customCategories',
] as const;

export default function ProPaywall({ visible, onClose, onPurchased }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setIsPro, setShowCongrats } = useSettings();
  const { currentOffering, purchasePackage, restorePurchases } = useRevenueCat();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    const pack = currentOffering?.availablePackages[0];
    if (!pack) {
      if (__DEV__) {
        setIsPro(true);
        setShowCongrats(true);
        onPurchased?.();
        onClose();
      }
      return;
    }
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      setIsPro(true);
      setShowCongrats(true);
      onPurchased?.();
      onClose();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[s.container, { paddingTop: insets.top + 16 }]}>
        {/* Close button */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.closeText}>{t('pro.notNow')}</Text>
        </TouchableOpacity>

        {/* Lottie Animation */}
        <View style={s.iconContainer}>
          <View style={s.animationContainer}>
            <LottieView
              style={{ width: '100%', height: '100%' }}
              source={require('@/assets/animation/drop.json')}
              autoPlay={true}
              loop={true}
            />
          </View>
        </View>

        {/* Headline */}
        <Text style={s.headline}>{t('pro.unlockPro')}</Text>

        {/* Feature list */}
        <View style={s.featureList}>
          {FEATURES.map((key) => (
            <View key={key} style={s.featureRow}>
              <View style={s.checkCircle}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={s.featureText}>{t(key)}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={handlePurchase}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.ctaText}>
              {t("pro.priceOnce", {
                price: (currentOffering?.availablePackages[0]?.product.priceString ?? "$4").replace("US$", "$"),
              })}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={s.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={s.restoreText}>{t('pro.restorePurchase')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  closeText: {
    fontSize: 15,
    color: C.t3,
    fontWeight: '500',
  },
  iconContainer: {
    marginBottom: 8,
  },
  animationContainer: {
    width: 120,
    height: 120,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  featureList: {
    width: '100%',
    gap: 14,
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: C.t1,
  },
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
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
