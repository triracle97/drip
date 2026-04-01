import { C, R, SP } from '@/constants/design';
import { getCurrency } from '@/constants/currencies';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useStore } from '@/store';
import { useSettings } from '@/store/settings';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const TOTAL_STEPS = 4;

const PRO_FEATURES = [
  'pro.feature.unlimitedSubs',
  'pro.feature.fullInsights',
  'pro.feature.fullCalendar',
  'pro.feature.trialTracking',
  'pro.feature.customCategories',
] as const;

export default function OnboardingSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<TrueSheet>(null);
  const { addIncome } = useStore();
  const { hasOnboarded, setHasOnboarded, currency } = useSettings();
  const { currentOffering, purchasePackage, restorePurchases } = useRevenueCat();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);

  const goForward = (nextStep: number) => {
    setDirection('forward');
    setStep(nextStep);
  };

  const goBack = () => {
    if (step > 0) {
      setDirection('back');
      setStep(step - 1);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([50, 50])
    .onEnd((e) => {
      if (e.translationX > 50 && step > 0) {
        runOnJS(goBack)();
      }
    });

  const currencySymbol = getCurrency(currency).symbol;

  useEffect(() => {
    if (!hasOnboarded) {
      const timer = setTimeout(() => {
        sheetRef.current?.present().catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasOnboarded]);

  const completeOnboarding = () => {
    sheetRef.current?.dismiss().then(() => {
      setHasOnboarded(true);
    }).catch(() => {
      setHasOnboarded(true);
    });
  };

  const handleIncomeSubmit = () => {
    const val = parseFloat(income);
    if (!val || val <= 0) return;
    addIncome({
      id: `i${Date.now()}`,
      label: 'Salary',
      amount: val * 12,
      isHourly: false,
      hoursPerWeek: 40,
    });
    goForward(3);
  };

  const handlePurchase = async () => {
    const pack = currentOffering?.availablePackages[0];
    if (!pack) return;
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      completeOnboarding();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  // ─── Step Dots ───
  const StepDots = () => (
    <View style={s.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[s.dot, i === step && s.dotActive]} />
      ))}
    </View>
  );

  // ─── Step 0: Value Prop ───
  const StepValueProp = () => (
    <Animated.View entering={FadeIn.duration(300)} style={s.stepContainer}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={s.appIcon}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill="#177b9c" />
            <Circle cx="9" cy="15" r="2.5" fill="#3a9cbc" />
          </Svg>
        </View>
        <Text style={s.headline}>{t('onboarding.headline')}</Text>
        <Text style={s.headlineAccent}>{t('onboarding.headlineAccent')}</Text>
        <Text style={s.subtitle}>{t('onboarding.subtitle')}</Text>
      </View>
      <View style={s.bottomArea}>
        <StepDots />
        <TouchableOpacity style={s.ctaBtn} onPress={() => goForward(1)} activeOpacity={0.8}>
          <Text style={s.ctaText}>{t('onboarding.getStarted')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── Step 1: Feature Showcase ───
  const StepFeatures = () => (
    <Animated.View entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)} exiting={direction === 'forward' ? SlideOutLeft.duration(200) : SlideOutRight.duration(200)} style={s.stepContainer}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
        {[
          { icon: 'calendar', title: t('onboarding.feature.calendar'), desc: t('onboarding.feature.calendarDesc') },
          { icon: 'insights', title: t('onboarding.feature.insights'), desc: t('onboarding.feature.insightsDesc') },
          { icon: 'trials', title: t('onboarding.feature.trials'), desc: t('onboarding.feature.trialsDesc') },
        ].map((f, i) => (
          <View key={i} style={s.featureItem}>
            <View style={s.featureIcon}>
              {f.icon === 'calendar' && (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
              )}
              {f.icon === 'insights' && (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 20V10M12 20V4M6 20v-6" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
              {f.icon === 'trials' && (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke={C.accent} strokeWidth={1.8} />
                  <Path d="M12 6v6l4 2" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={s.bottomArea}>
        <StepDots />
        <TouchableOpacity style={s.ctaBtn} onPress={() => goForward(2)} activeOpacity={0.8}>
          <Text style={s.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── Step 2: Income Input ───
  const StepIncome = () => (
    <Animated.View entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)} exiting={direction === 'forward' ? SlideOutLeft.duration(200) : SlideOutRight.duration(200)} style={s.stepContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={s.incomeTitle}>{t('onboarding.incomeQuestion')}</Text>
        <View style={s.incomeInputRow}>
          <Text style={s.currencySymbol}>{currencySymbol}</Text>
          <TextInput
            style={s.incomeInput}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={C.t3}
            autoFocus
          />
        </View>
        <Text style={s.incomeHint}>{t('onboarding.incomeHint')}</Text>
      </KeyboardAvoidingView>
      <View style={s.bottomArea}>
        <StepDots />
        <TouchableOpacity
          style={[s.ctaBtn, (!income || parseFloat(income) <= 0) && s.ctaBtnDisabled]}
          onPress={handleIncomeSubmit}
          activeOpacity={0.8}
          disabled={!income || parseFloat(income) <= 0}
        >
          <Text style={s.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── Step 3: Paywall ───
  const StepPaywall = () => (
    <Animated.View entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)} exiting={direction === 'forward' ? SlideOutLeft.duration(200) : SlideOutRight.duration(200)} style={s.stepContainer}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={s.appIconSmall}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z" fill="#177b9c" />
            <Circle cx="9" cy="15" r="2.5" fill="#3a9cbc" />
          </Svg>
        </View>
        <Text style={s.paywallHeadline}>{t('pro.unlockPro')}</Text>
        <View style={s.paywallFeatures}>
          {PRO_FEATURES.map((key) => (
            <View key={key} style={s.paywallFeatureRow}>
              <View style={s.checkCircle}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={s.paywallFeatureText}>{t(key)}</Text>
            </View>
          ))}
        </View>
        <Text style={s.paywallPrice}>{t('pro.priceOnce')}</Text>
      </View>
      <View style={s.bottomArea}>
        <StepDots />
        <TouchableOpacity style={s.ctaBtn} onPress={handlePurchase} activeOpacity={0.8} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.ctaText}>{t('pro.ctaButton')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} activeOpacity={0.7} disabled={loading}>
          <Text style={s.restoreText}>{t('pro.restorePurchase')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.skipBtn} onPress={completeOnboarding} activeOpacity={0.7}>
          <Text style={s.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (hasOnboarded) return null;

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[1]}
      dismissible={false}
      grabber={false}
      cornerRadius={0}
    >
      <GestureDetector gesture={swipeGesture}>
        <View style={[s.container, { height: screenHeight, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          {step === 0 && <StepValueProp />}
          {step === 1 && <StepFeatures />}
          {step === 2 && <StepIncome />}
          {step === 3 && <StepPaywall />}
        </View>
      </GestureDetector>
    </TrueSheet>
  );
}

const { width, height: screenHeight } = Dimensions.get('window');

const s = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
  },
  bottomArea: {
    paddingBottom: 8,
    gap: 12,
  },

  // Step dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.line,
  },
  dotActive: {
    backgroundColor: C.black,
    width: 24,
  },

  // CTA button
  ctaBtn: {
    backgroundColor: C.black,
    borderRadius: R.md,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    opacity: 0.3,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },

  // Step 0 — Value Prop
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: C.t1,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headlineAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: C.accent,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: C.t2,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Step 1 — Features
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 28,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.t1,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: C.t2,
    lineHeight: 20,
  },

  // Step 2 — Income
  incomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 24,
  },
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: C.t3,
  },
  incomeInput: {
    fontSize: 36,
    fontWeight: '700',
    color: C.t1,
    minWidth: 120,
    textAlign: 'center',
  },
  incomeHint: {
    fontSize: 13,
    color: C.t3,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },

  // Step 3 — Paywall
  appIconSmall: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 20,
  },
  paywallHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: C.t1,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  paywallFeatures: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  paywallFeatureRow: {
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
  paywallFeatureText: {
    fontSize: 15,
    fontWeight: '500',
    color: C.t1,
  },
  paywallPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: C.t2,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 13,
    color: C.t3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.t2,
  },
});
