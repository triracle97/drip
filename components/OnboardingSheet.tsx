import { getCurrency } from "@/constants/currencies";
import { C, R } from "@/constants/design";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useStore } from "@/store";
import { useSettings } from "@/store/settings";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import LottieView from "lottie-react-native";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  TrendingUp,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import CurrencySheet from "./CurrencySheet";

const TOTAL_STEPS = 4;

const PRO_FEATURES = [
  "pro.feature.unlimitedSubs",
  "pro.feature.fullInsights",
  "pro.feature.fullCalendar",
  "pro.feature.trialTracking",
  "pro.feature.customCategories",
] as const;

// ─── Stable External Subcomponents ───
const Dot = ({ isActive }: { isActive: boolean }) => {
  const style = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 300 }),
    backgroundColor: withTiming(isActive ? C.black : C.line, { duration: 300 }),
  }));
  return <Animated.View style={[s.dot, style]} />;
};

export default function OnboardingSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<TrueSheet>(null);
  const { addIncome } = useStore();
  const { hasOnboarded, setHasOnboarded, currency, setIsPro, setShowCongrats } =
    useSettings();
  const { currentOffering, purchasePackage, restorePurchases } =
    useRevenueCat();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);
  const [currencyVisible, setCurrencyVisible] = useState(false);

  const keyboard = useAnimatedKeyboard();

  const goForward = (nextStep: number) => {
    setDirection("forward");
    setStep(nextStep);
  };

  const goBack = () => {
    if (step > 0) {
      setDirection("back");
      setStep(step - 1);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-50, 50])
    .onEnd((e) => {
      if (e.translationX > 50 && step > 0) {
        runOnJS(goBack)();
      } else if (e.translationX < -50 && step < TOTAL_STEPS - 1) {
        if (step === 2) {
          // Only allow swipe forward on income step if valid
          if (parseFloat(income) > 0) {
            runOnJS(handleIncomeSubmit)();
          }
        } else {
          runOnJS(goForward)(step + 1);
        }
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
    sheetRef.current
      ?.dismiss()
      .then(() => {
        setHasOnboarded(true);
      })
      .catch(() => {
        setHasOnboarded(true);
      });
  };

  const handleIncomeSubmit = () => {
    const val = parseFloat(income);
    if (!val || val <= 0) return;
    addIncome({
      id: `i${Date.now()}`,
      label: "Salary",
      amount: val * 12,
      isHourly: false,
      hoursPerWeek: 40,
    });
    goForward(3);
  };

  const handlePurchase = async () => {
    const pack = currentOffering?.availablePackages[0];
    if (!pack) {
      // Fallback for Simulator testing if no packages are loaded
      if (__DEV__) {
        setIsPro(true);
        setShowCongrats(true);
        completeOnboarding();
      }
      return;
    }
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      setIsPro(true);
      setShowCongrats(true);
      completeOnboarding();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  // ─── Step Dots ───
  const renderStepDots = () => (
    <View style={s.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <Dot key={i} isActive={i === step} />
      ))}
    </View>
  );

  // ─── Shared Bottom Area ───
  const renderBottomArea = () => (
    <View style={s.bottomArea}>
      {renderStepDots()}
      {step === 0 && (
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => goForward(1)}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>{t("onboarding.getStarted")}</Text>
        </TouchableOpacity>
      )}
      {step === 1 && (
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => goForward(2)}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>{t("onboarding.continue")}</Text>
        </TouchableOpacity>
      )}
      {step === 2 && (
        <TouchableOpacity
          style={[
            s.ctaBtn,
            (!income || parseFloat(income) <= 0) && s.ctaBtnDisabled,
          ]}
          onPress={handleIncomeSubmit}
          activeOpacity={0.8}
          disabled={!income || parseFloat(income) <= 0}
        >
          <Text style={s.ctaText}>{t("onboarding.continue")}</Text>
        </TouchableOpacity>
      )}
      {step === 3 && (
        <>
          <TouchableOpacity
            style={[s.ctaBtn, s.paywallCtaBtn]}
            onPress={handlePurchase}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[s.ctaText, s.paywallCtaText]}>
                {t("pro.priceOnce", {
                  price: (
                    currentOffering?.availablePackages[0]?.product
                      .priceString ?? "$4"
                  ).replace("US$", "$"),
                })}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.restoreBtn}
            onPress={handleRestore}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={s.restoreText}>{t("pro.restorePurchase")}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // ─── Step 0: Value Prop ───
  const renderStepValueProp = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={s.stepContainer}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={s.onboardingAnimationContainer}>
          <LottieView
            style={{ width: "100%", height: "100%" }}
            source={require("@/assets/animation/drop.json")}
            autoPlay={true}
            loop={true}
          />
        </View>

        <Text style={s.headline}>Subscriptions,</Text>
        <Text style={s.headlineAccent}>Mastered.</Text>
        <Text style={s.subtitle}>
          See the exact cost of your subscriptions in real work-hours, track
          renewals, and never overpay again.
        </Text>
      </View>
    </Animated.View>
  );

  // ─── Step 1: Feature Showcase ───
  const renderStepFeatures = () => (
    <Animated.View
      entering={
        direction === "forward"
          ? SlideInRight.duration(300)
          : SlideInLeft.duration(300)
      }
      exiting={
        direction === "forward"
          ? SlideOutLeft.duration(200)
          : SlideOutRight.duration(200)
      }
      style={s.stepContainer}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 8 }}>
        <View style={s.featuresHeaderIcon}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z"
              fill={C.primary}
            />
            <Circle cx="9" cy="15" r="2.5" fill={C.primarySub} />
          </Svg>
        </View>

        <Text style={s.featuresHeadline}>Never overpay again.</Text>
        <Text style={s.featuresSubtitle}>
          Drip brings absolute clarity to your recurring expenses.
        </Text>

        <View style={{ marginTop: 36 }}>
          {[
            {
              id: "calendar",
              title: t("onboarding.feature.calendar"),
              desc: t("onboarding.feature.calendarDesc"),
            },
            {
              id: "insights",
              title: t("onboarding.feature.insights"),
              desc: t("onboarding.feature.insightsDesc"),
            },
            {
              id: "trials",
              title: t("onboarding.feature.trials"),
              desc: t("onboarding.feature.trialsDesc"),
            },
          ].map((f, i) => (
            <View key={i} style={s.featureItem}>
              <View style={s.featureIcon}>
                {f.id === "calendar" && (
                  <CalendarDays color={C.primary} size={22} strokeWidth={2} />
                )}
                {f.id === "insights" && (
                  <TrendingUp color={C.primary} size={22} strokeWidth={2} />
                )}
                {f.id === "trials" && (
                  <Clock color={C.primary} size={22} strokeWidth={2} />
                )}
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  // ─── Step 2: Income Input ───
  const renderStepIncome = () => (
    <Animated.View
      entering={
        direction === "forward"
          ? SlideInRight.duration(300)
          : SlideInLeft.duration(300)
      }
      exiting={
        direction === "forward"
          ? SlideOutLeft.duration(200)
          : SlideOutRight.duration(200)
      }
      style={s.stepContainer}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={s.featuresHeadline}>Your Monthly Income?</Text>
        <Text style={s.featuresSubtitle}>
          We need this to calculate your subscriptions' true cost in working
          hours.
        </Text>

        <View style={s.incomeInputRow}>
          <TouchableOpacity
            onPress={() => setCurrencyVisible(true)}
            style={s.currencySelector}
            activeOpacity={0.7}
          >
            <Text style={s.currencySymbol}>{currencySymbol}</Text>
            <ChevronDown color={C.t3} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
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
      </View>
    </Animated.View>
  );

  // ─── Step 3: Paywall ───
  const renderStepPaywall = () => (
    <Animated.View
      entering={
        direction === "forward"
          ? SlideInRight.duration(300)
          : SlideInLeft.duration(300)
      }
      exiting={
        direction === "forward"
          ? SlideOutLeft.duration(200)
          : SlideOutRight.duration(200)
      }
      style={s.stepContainer}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={s.onboardingAnimationContainer}>
          <LottieView
            style={{ width: "100%", height: "100%" }}
            source={require("@/assets/animation/drop.json")}
            autoPlay={true}
            loop={true}
          />
        </View>
        <Text style={s.paywallHeadline}>{t("pro.unlockPro")}</Text>
        <View style={s.paywallFeatures}>
          {PRO_FEATURES.map((key) => (
            <View key={key} style={s.paywallFeatureRow}>
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
              <Text style={s.paywallFeatureText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  // if (hasOnboarded) return null;

  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const animatedContainerStyle = useAnimatedStyle(() => ({
    paddingBottom: isIPad ? 24 : insets.bottom + 56 + keyboard.height.value,
  }));

  return (
    <>
      <TrueSheet
        ref={sheetRef}
        detents={[1]}
        dismissible={false}
        grabber={false}
        cornerRadius={0}
        backgroundColor={C.bg}
      >
        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            style={[
              s.container,
              { paddingTop: insets.top + 16 },
              Platform.OS === "ios" && Platform.isPad
                ? { flex: 1, minHeight: 600 }
                : { height: "100%" },
              animatedContainerStyle,
            ]}
          >
            <View style={{ flex: 1, position: "relative" }}>
              {step === 0 && renderStepValueProp()}
              {step === 1 && renderStepFeatures()}
              {step === 2 && renderStepIncome()}
              {step === 3 && renderStepPaywall()}
            </View>

            {(step === 2 || step === 3) && (
              <TouchableOpacity
                style={[s.absoluteSkipBtn, { top: insets.top + 12 }]}
                onPress={step === 2 ? () => goForward(3) : completeOnboarding}
                activeOpacity={0.7}
              >
                <Text style={s.absoluteSkipText}>{t("onboarding.skip")}</Text>
              </TouchableOpacity>
            )}

            {renderBottomArea()}
          </Animated.View>
        </GestureDetector>
      </TrueSheet>
      <CurrencySheet
        visible={currencyVisible}
        onClose={() => setCurrencyVisible(false)}
      />
    </>
  );
}

const { width, height: screenHeight } = Dimensions.get("window");

const s = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    paddingHorizontal: 24,
  },
  stepContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  bottomArea: {
    paddingBottom: 8,
    gap: 12,
  },

  // Step dots
  dots: {
    flexDirection: "row",
    justifyContent: "center",
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
    alignItems: "center",
  },
  ctaBtnDisabled: {
    opacity: 0.3,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  paywallCtaBtn: {
    backgroundColor: C.primary,
    borderRadius: 100,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  paywallCtaText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Step 0 — Value Prop
  onboardingAnimationContainer: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: C.t1,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headlineAccent: {
    fontSize: 28,
    fontWeight: "800",
    color: C.primary,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: C.t2,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
  },

  // Step 1 — Features
  featuresHeaderIcon: {
    marginBottom: 20,
    alignItems: "center",
  },
  featuresHeadline: {
    fontSize: 26,
    fontWeight: "800",
    color: C.t1,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  featuresSubtitle: {
    fontSize: 15,
    color: C.t2,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 26,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(23,123,156,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.t1,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: C.t2,
    lineHeight: 20,
  },

  // Step 2 — Income
  incomeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 40,
    marginBottom: 40,
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: C.line,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: C.t2,
  },
  incomeInput: {
    fontSize: 48,
    fontWeight: "800",
    color: C.t1,
    minWidth: 140,
    textAlign: "center",
  },

  // Step 3 — Paywall
  paywallHeadline: {
    fontSize: 28,
    fontWeight: "800",
    color: C.t1,
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  paywallFeatures: {
    width: "100%",
    gap: 14,
    marginBottom: 36,
  },
  paywallFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  paywallFeatureText: {
    fontSize: 16,
    fontWeight: "500",
    color: C.t1,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 13,
    color: C.t3,
  },
  absoluteSkipBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  absoluteSkipText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.t3,
  },
});
