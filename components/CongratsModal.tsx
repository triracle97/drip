import { C } from "@/constants/design";
import { useSettings } from "@/store/settings";
import LottieView from "lottie-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CongratsModal() {
  const { t } = useTranslation();
  const showCongrats = useSettings((s) => s.showCongrats);
  const setShowCongrats = useSettings((s) => s.setShowCongrats);
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    setShowCongrats(false);
  };

  if (!showCongrats) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={[s.root, { paddingBottom: insets.bottom + 20 }]}
    >

      {/* Content Box */}
      <View style={s.content}>
        {/* Confetti */}
        <View style={s.lottieContainer} pointerEvents="none">
          <LottieView
            source={require("@/assets/animation/Confetti.json")}
            autoPlay
            loop={true}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onAnimationFinish={() => {}}
          />
        </View>

        <Text style={s.title}>{t("pro.purchaseSuccess")}</Text>
        <Text style={s.description}>{t("pro.congratsDesc")}</Text>

        <TouchableOpacity
          style={s.ctaBtn}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>{t("pro.congratsCta")}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  lottieContainer: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  content: {
    backgroundColor: C.bg,
    width: "100%",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.t1,
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: C.t2,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
