import { C } from "@/constants/design";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useSettings } from "@/store/settings";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

export type ProFeatureKey =
  | "subs"
  | "insights"
  | "calendar"
  | "trial"
  | "categories"
  | "customSub";

interface Props {
  feature: ProFeatureKey | null;
  onClose: () => void;
  onPurchased?: () => void;
}

// Placeholder for future Lottie animation

export default function ProSheet({ feature, onClose, onPurchased }: Props) {
  const { t } = useTranslation();
  const { setIsPro, setPendingCongrats } = useSettings();
  const { currentOffering, purchasePackage, restorePurchases } =
    useRevenueCat();
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
    if (!pack) {
      if (__DEV__) {
        setIsPro(true);
        setPendingCongrats(true);
        onPurchased?.();
        sheetRef.current?.dismiss().catch(() => {});
      } else {
        Alert.alert(
          "Purchase Unavailable",
          "Products are currently not available. If you're on TestFlight, please ensure RevenueCat configuration and App Store Connect products are set up correctly."
        );
      }
      return;
    }
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      setIsPro(true);
      setPendingCongrats(true);
      onPurchased?.();
      sheetRef.current?.dismiss().catch(() => {});
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  const handleDismiss = () => {
    // If no parent sheet handles congrats (top-level usage), flush it now
    if (!onPurchased) {
      const { pendingCongrats, setPendingCongrats, setShowCongrats } = useSettings.getState();
      if (pendingCongrats) {
        setPendingCongrats(false);
        setTimeout(() => setShowCongrats(true), 200);
      }
    }
    onClose();
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      cornerRadius={32}
      onDidDismiss={handleDismiss}
      grabber={false}
    >
      <View style={s.content}>
        <View style={s.animationContainer}>
          <LottieView
            style={{ width: "100%", height: "100%" }}
            source={require("@/assets/animation/drop.json")}
            autoPlay={true}
            loop={true}
          />
        </View>

        <Text style={s.headline}>
          {feature ? t(`pro.headline.${feature}`) : ""}
        </Text>
        <Text style={s.desc}>{feature ? t(`pro.desc.${feature}`) : ""}</Text>

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

        <TouchableOpacity
          style={s.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={s.restoreText}>{t("pro.restorePurchase")}</Text>
        </TouchableOpacity>
      </View>
    </TrueSheet>
  );
}

const s = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 48,
    alignItems: "center",
  },
  animationContainer: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: C.t1,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 16,
    color: C.t2,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  ctaBtn: {
    backgroundColor: "#177b9c",
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#177b9c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  restoreBtn: {
    marginTop: 20,
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.t3,
  },
});
