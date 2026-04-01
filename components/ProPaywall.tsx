import { C, R } from '@/constants/design';
import { useRevenueCat } from '@/hooks/useRevenueCat';
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
import Svg, { Circle, Path } from 'react-native-svg';

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
  const { currentOffering, purchasePackage, restorePurchases } = useRevenueCat();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    const pack = currentOffering?.availablePackages[0];
    if (!pack) return;
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
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

        {/* App icon */}
        <View style={s.iconContainer}>
          <View style={s.appIcon}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill="#177b9c" />
              <Circle cx="9" cy="15" r="2.5" fill="#3a9cbc" />
            </Svg>
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

        {/* Price */}
        <Text style={s.price}>{t('pro.priceOnce')}</Text>

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
            <Text style={s.ctaText}>{t('pro.ctaButton')}</Text>
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
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
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
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: C.t1,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: C.t2,
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: C.black,
    borderRadius: R.md,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  restoreBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    color: C.t3,
  },
});
