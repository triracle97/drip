import AnimatedPressable from "@/components/AnimatedPressable";
import AppearanceModal from "@/components/AppearanceModal";
import BrandLogo from "@/components/BrandLogo";
import Card from "@/components/Card";
import { C, R } from "@/constants/design";
import { Sub, useStore } from "@/store";
import { useSettings } from "@/store/settings";
import { getPopularSubs, PopularSub } from "@/store/supabase";
import { addDaysISO, blended, fmt, moEq, toHrs } from "@/utils/calc";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, {
    forwardRef,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInLeft,
    FadeInRight,
    FadeOutLeft,
    FadeOutRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// ─── Constants ───
const CYCLE_KEYS: [string, string][] = [
  ["weekly", "billing.everyWeek"],
  ["biweekly", "billing.every2Weeks"],
  ["monthly", "billing.everyMonth"],
  ["quarterly", "billing.every3Months"],
  ["biannual", "billing.every6Months"],
  ["yearly", "billing.everyYear"],
  ["custom", "billing.custom"],
];

const REMINDER_KEYS: [string, string][] = [
  ["", "reminder.never"],
  ["1", "reminder.1day"],
  ["2", "reminder.2days"],
  ["3", "reminder.3days"],
  ["7", "reminder.7days"],
];

interface Form {
  name: string;
  icon: string;
  color: string;
  cost: string;
  cycle: string;
  categoryId: string;
  billDay: string;
  startDate: string;
  isTrial: boolean;
  trialDays: string;
  customNum: string;
  customUnit: string;
  reminderDays: string;
}

const DEFAULT_FORM: Form = {
  name: "",
  icon: "📦",
  color: "#000000",
  cost: "",
  cycle: "monthly",
  categoryId: "cat_other",
  billDay: "1",
  startDate: new Date().toISOString().split("T")[0],
  isTrial: false,
  trialDays: "14",
  customNum: "2",
  customUnit: "months",
  reminderDays: "",
};

function cycleLabelFull(f: Form, t: (key: string) => string) {
  if (f.cycle === "custom")
    return `Every ${f.customNum || 2} ${f.customUnit || "months"} `;
  const key =
    CYCLE_KEYS.find(([v]) => v === f.cycle)?.[1] ?? "billing.everyMonth";
  return t(key);
}

function ServiceIcon({
  icon,
  size = 22,
  useOriginalColor,
}: {
  icon: string;
  size?: number;
  useOriginalColor?: boolean;
}) {
  if (icon.startsWith("svg:")) {
    return (
      <BrandLogo
        name={icon.slice(4)}
        size={size}
        color={useOriginalColor ? undefined : "#FFFFFF"}
        useOriginalColor={useOriginalColor}
      />
    );
  }
  return <Text style={{ fontSize: size }}>{icon}</Text>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 10,
          color: C.t3,
          fontWeight: "600",
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const AddSubSheet = forwardRef<TrueSheet>(function AddSubSheet(_props, ref) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addSub, incomes, categories } = useStore();
  const currency = useSettings((s) => s.currency);
  const rate = blended(incomes);

  const [popularSubs, setPopularSubs] = useState<PopularSub[]>([]);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"pick" | "form">("pick");
  const [f, setF] = useState<Form>({ ...DEFAULT_FORM });
  const [cycleOpen, setCycleOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  // Keep a local ref so we can call dismiss() internally
  const sheetRef = useRef<TrueSheet>(null);
  const setRefs = useCallback(
    (node: TrueSheet | null) => {
      sheetRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<TrueSheet | null>).current = node;
    },
    [ref],
  );

  const u = (k: keyof Form, v: any) => setF((prev) => ({ ...prev, [k]: v }));
  const mc = moEq(
    parseFloat(f.cost) || 0,
    f.cycle,
    parseFloat(f.customNum) || 1,
    f.customUnit,
  );
  const canSave = f.name.trim() && parseFloat(f.cost) > 0;

  // Reset state when sheet presents
  const handlePresent = useCallback(() => {
    getPopularSubs().then(setPopularSubs);
    setQuery("");
    setPhase("pick");
    setF({ ...DEFAULT_FORM });
    setCycleOpen(false);
  }, []);

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss().catch(() => {});
  }, []);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => {
      m[c.id] = c.name;
    });
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    if (!query.trim()) return popularSubs;
    const q = query.toLowerCase();
    return popularSubs.filter((s) => s.name.toLowerCase().includes(q));
  }, [popularSubs, query]);

  const pickBrand = (q: PopularSub) => {
    setF({
      ...DEFAULT_FORM,
      name: q.name,
      icon: q.icon,
      categoryId: q.category_id,
      cost: String(q.default_cost),
      color: q.color,
    });
    setPhase("form");
  };

  const pickCustom = () => {
    setF({ ...DEFAULT_FORM });
    setPhase("form");
  };

  const goBack = () => {
    setCycleOpen(false);
    setPhase("pick");
  };

  const save = () => {
    if (!canSave) return;
    const trialEnd = f.isTrial ? addDaysISO(parseInt(f.trialDays) || 0) : '';
    const bd = f.startDate
      ? new Date(f.startDate).getDate()
      : parseInt(f.billDay) || 1;
    const newSub: Sub = {
      id: `s${Date.now()} `,
      name: f.name,
      icon: f.icon,
      cost: parseFloat(f.cost),
      cycle: f.cycle,
      categoryId: f.categoryId,
      active: true,
      billDay: bd,
      startDate: f.startDate,
      color: f.color,
      isTrial: f.isTrial,
      trialEndDay: trialEnd,
      trialDecision: f.isTrial ? "pending" : "none",
      customNum:
        f.cycle === "custom" ? parseFloat(f.customNum) || 1 : undefined,
      customUnit: f.cycle === "custom" ? f.customUnit : undefined,
      reminderDays: f.reminderDays ? parseInt(f.reminderDays) : null,
      sortOrder: 0,
    };
    addSub(newSub);
    dismiss();
  };

  // ─── Picker Phase ───
  const renderPicker = () => (
    <Animated.View
      key="picker"
      entering={FadeInLeft.duration(250)}
      exiting={FadeOutLeft.duration(200)}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.title}>{t("addSub.title")}</Text>
        <TouchableOpacity
          onPress={dismiss}
          style={s.closeBtn}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
              d="M4 4l8 8M12 4l-8 8"
              stroke={C.t3}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              stroke={C.t3}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t("addSub.searchPlaceholder")}
            placeholderTextColor={C.t3}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Service List */}
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sectionLabel}>{t("addSub.popularServices")}</Text>

        {filtered.map((q) => {
          const isWhiteBg =
            q.color.toUpperCase() === "#FFFFFF" ||
            q.color.toUpperCase() === "#FFF";
          return (
            <AnimatedPressable
              key={q.id}
              onPress={() => pickBrand(q)}
              style={s.serviceRow}
            >
              <View style={isWhiteBg && s.serviceIconShadow}>
                <View style={[s.serviceIcon, { backgroundColor: q.color }]}>
                  <ServiceIcon
                    icon={q.icon}
                    size={22}
                    useOriginalColor={isWhiteBg}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.serviceName}>{q.name}</Text>
                <Text style={s.serviceCat}>
                  {catMap[q.category_id] || "Other"}
                </Text>
              </View>
              <View style={s.addCircle}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 5v14M5 12h14"
                    stroke={C.black}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </AnimatedPressable>
          );
        })}

        {filtered.length === 0 && query.trim() !== "" && (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ fontSize: 14, color: C.t3 }}>
              {t("addSub.noResults", { query })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky custom button */}
      <View
        style={[
          s.stickyBottom,
          { paddingBottom: Math.max(insets.bottom, 16) + 60 },
        ]}
      >
        <AnimatedPressable onPress={pickCustom} style={s.customBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke={C.t2}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={s.customBtnText}>{t("addSub.addCustom")}</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );

  // ─── Form Phase ───
  const renderForm = () => (
    <Animated.View
      key="form"
      entering={FadeInRight.duration(250)}
      exiting={FadeOutRight.duration(200)}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={s.headerRow}>
        <TouchableOpacity
          onPress={goBack}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <Path
              d="M10 3L5 8l5 5"
              stroke={C.t2}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={{ fontSize: 14, color: C.t2, fontWeight: "500" }}>
            {t("common.back")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={dismiss}
          style={s.closeBtn}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
              d="M4 4l8 8M12 4l-8 8"
              stroke={C.t3}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <Field label={t("addSub.name")}>
          <TextInput
            style={s.inp}
            value={f.name}
            onChangeText={(v) => u("name", v)}
            placeholder="Subscription name..."
            placeholderTextColor={C.t3}
          />
        </Field>

        {/* Price & Billing cycle */}
        <Field label={t("addSub.priceBilling")}>
          <View style={s.priceCycleRow}>
            <View style={[s.dollarRow, { flex: 1 }]}>
              <Text style={s.dollarSign}>$</Text>
              <TextInput
                style={[
                  s.inp,
                  {
                    flex: 1,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  },
                ]}
                value={f.cost}
                onChangeText={(v) => u("cost", v)}
                placeholder="0.00"
                placeholderTextColor={C.t3}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              onPress={() => setCycleOpen(true)}
              style={s.cyclePill}
              activeOpacity={0.8}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: C.t1 }}
                numberOfLines={1}
              >
                {cycleLabelFull(f, t)}
              </Text>
              <Svg width={10} height={10} viewBox="0 0 16 16" fill="none">
                <Path
                  d="M6 3l5 5-5 5"
                  stroke={C.t3}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          {f.cycle === "custom" && (
            <View style={s.customCycleRow}>
              <Text style={{ fontSize: 12, color: C.t2 }}>Every</Text>
              <TextInput
                style={[s.inp, { width: 52, textAlign: "center" }]}
                value={f.customNum}
                onChangeText={(v) => u("customNum", v)}
                keyboardType="number-pad"
              />
              <View style={s.segRow}>
                {(["weeks", "months", "years"] as const).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => u("customUnit", unit)}
                    style={[s.seg, f.customUnit === unit && s.segActive]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.segTxt,
                        f.customUnit === unit && s.segTxtActive,
                      ]}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Field>

        {/* Billing cycle popup */}
        <Modal
          visible={cycleOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCycleOpen(false)}
        >
          <TouchableOpacity
            style={s.popupOverlay}
            activeOpacity={1}
            onPress={() => setCycleOpen(false)}
          >
            <View style={s.popupCard}>
              <Text style={s.popupTitle}>Billing Cycle</Text>
              {CYCLE_KEYS.map(([v, key]) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => {
                    u("cycle", v);
                    setCycleOpen(false);
                  }}
                  style={[
                    s.popupItem,
                    f.cycle === v && { backgroundColor: C.bgSub },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: f.cycle === v ? C.t1 : C.t2,
                      fontWeight: f.cycle === v ? "600" : "500",
                    }}
                  >
                    {t(key)}
                  </Text>
                  {f.cycle === v && (
                    <Text style={{ color: C.t1, fontSize: 14 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Category */}
        <Field label={t("addSub.category")}>
          <TouchableOpacity
            onPress={() => setCategoryOpen(true)}
            style={s.selectBtn}
            activeOpacity={0.8}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor:
                    categories.find((c) => c.id === f.categoryId)?.color ||
                    C.t3,
                }}
              />
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.t1 }}>
                {categories.find((c) => c.id === f.categoryId)?.name ||
                  "Select"}
              </Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
              <Path
                d="M6 3l5 5-5 5"
                stroke={C.t3}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </Field>

        {/* Category popup */}
        <Modal
          visible={categoryOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryOpen(false)}
        >
          <TouchableOpacity
            style={s.popupOverlay}
            activeOpacity={1}
            onPress={() => setCategoryOpen(false)}
          >
            <View style={s.popupCard}>
              <Text style={s.popupTitle}>{t("addSub.category")}</Text>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    u("categoryId", c.id);
                    setCategoryOpen(false);
                  }}
                  style={[
                    s.popupItem,
                    f.categoryId === c.id && { backgroundColor: C.bgSub },
                  ]}
                  activeOpacity={0.75}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: c.color,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: f.categoryId === c.id ? C.t1 : C.t2,
                        fontWeight: f.categoryId === c.id ? "600" : "500",
                      }}
                    >
                      {c.name}
                    </Text>
                  </View>
                  {f.categoryId === c.id && (
                    <Text style={{ color: C.t1, fontSize: 14 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Start date */}
        <Field label={t("addSub.startDate")}>
          <Text
            style={[s.inp, { color: C.t1, fontSize: 14, fontWeight: "500" }]}
          >
            {f.startDate || t("time.today")}
          </Text>
          <Text style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>
            {t("addSub.billsOnDate")}
          </Text>
        </Field>

        {/* Icon & Color */}
        <Field label={t("addSub.iconColor")}>
          <AnimatedPressable
            onPress={() => setShowAppearance(true)}
            style={s.appearanceRow}
          >
            <View
              style={[
                s.iconPreview,
                { backgroundColor: f.color },
                (f.color.toUpperCase() === "#FFFFFF" ||
                  f.color.toUpperCase() === "#FFF") &&
                  s.serviceIconShadow,
              ]}
            >
              {f.icon.startsWith("svg:") ? (
                <BrandLogo
                  name={f.icon.slice(4)}
                  size={22}
                  color={
                    f.color.toUpperCase() === "#FFFFFF" ||
                    f.color.toUpperCase() === "#FFF"
                      ? undefined
                      : "#FFFFFF"
                  }
                  useOriginalColor={
                    f.color.toUpperCase() === "#FFFFFF" ||
                    f.color.toUpperCase() === "#FFF"
                  }
                />
              ) : (
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.t1 }}>
                {f.name || t("appearance.subscription")}
              </Text>
              <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
                {t("addSub.tapToChange")}
              </Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
              <Path
                d="M6 3l5 5-5 5"
                stroke={C.t3}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </AnimatedPressable>
        </Field>

        {/* Trial toggle */}
        <View
          style={[
            s.trialBox,
            {
              backgroundColor: f.isTrial ? C.redBg : C.bgSub,
              borderBottomLeftRadius: f.isTrial ? 0 : R.md,
              borderBottomRightRadius: f.isTrial ? 0 : R.md,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.trialLabel, { color: f.isTrial ? C.red : C.t1 }]}>
              {t("addSub.freeTrial")}
            </Text>
            <Text style={{ fontSize: 12, color: C.t3 }}>
              {t("addSub.trialReminder")}
            </Text>
          </View>
          <View style={{ transform: [{ scale: 0.7 }] }}>
            <Switch
              value={f.isTrial}
              onValueChange={(v) => u("isTrial", v)}
              trackColor={{ false: "rgba(0,0,0,0.16)", true: C.black }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {f.isTrial && (
          <View style={s.trialDaysRow}>
            <Text
              style={{
                fontSize: 10,
                color: C.red,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {t("addSub.trialLength")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["7", "14", "30"].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => u("trialDays", d)}
                  style={[
                    s.trialDayBtn,
                    f.trialDays === d && {
                      backgroundColor: C.redBg,
                      borderColor: C.redLine,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: f.trialDays === d ? C.red : C.t3,
                    }}
                  >
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={[
                  s.inp,
                  {
                    flex: 1,
                    textAlign: "center",
                    color: C.red,
                    fontSize: 11,
                    height: 36,
                    padding: 0,
                  },
                ]}
                value={
                  !["7", "14", "30"].includes(f.trialDays) ? f.trialDays : ""
                }
                onChangeText={(v) => u("trialDays", v)}
                placeholder={t("addSub.custom")}
                placeholderTextColor={C.t3}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {/* Reminder */}
        <View style={{ marginTop: 20 }} />
        <Field label={t("addSub.reminder")}>
          <TouchableOpacity
            onPress={() => setReminderOpen(true)}
            style={s.selectBtn}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.t1 }}>
              {t(
                REMINDER_KEYS.find(([v]) => v === f.reminderDays)?.[1] ??
                  "reminder.never",
              )}
            </Text>
            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
              <Path
                d="M6 3l5 5-5 5"
                stroke={C.t3}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </Field>

        {/* Reminder popup */}
        <Modal
          visible={reminderOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setReminderOpen(false)}
        >
          <TouchableOpacity
            style={s.popupOverlay}
            activeOpacity={1}
            onPress={() => setReminderOpen(false)}
          >
            <View style={s.popupCard}>
              <Text style={s.popupTitle}>{t("addSub.reminder")}</Text>
              {REMINDER_KEYS.map(([v, key]) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => {
                    u("reminderDays", v);
                    setReminderOpen(false);
                  }}
                  style={[
                    s.popupItem,
                    f.reminderDays === v && { backgroundColor: C.bgSub },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: f.reminderDays === v ? C.t1 : C.t2,
                      fontWeight: f.reminderDays === v ? "600" : "500",
                    }}
                  >
                    {t(key)}
                  </Text>
                  {f.reminderDays === v && (
                    <Text style={{ color: C.t1, fontSize: 14 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Work preview */}
        {parseFloat(f.cost) > 0 && (
          <Card style={s.workPreview}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: C.t3,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {f.isTrial ? `AFTER ${f.trialDays} DAYS` : "THIS COSTS YOU"}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: C.t1,
                  marginTop: 2,
                }}
              >
                {toHrs(mc, rate)} of work
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 14, color: C.t2, fontWeight: "700" }}>
                {fmt(mc)}
                <Text style={{ fontSize: 12, color: C.t3, fontWeight: "400" }}>
                  /month
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
                {fmt(mc * 12)}/year
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Sticky save button */}
      <View
        style={[
          s.stickyBottom,
          { paddingBottom: Math.max(insets.bottom, 16) + 60 },
        ]}
      >
        <AnimatedPressable
          onPress={save}
          disabled={!canSave}
          style={[
            s.saveBtn,
            {
              backgroundColor: canSave ? C.black : C.bgSub,
              opacity: canSave ? 1 : 0.5,
            },
          ]}
        >
          <Text style={[s.saveTxt, { color: canSave ? "#fff" : C.t3 }]}>
            {f.isTrial ? t("addSub.addTrial") : t("addSub.addSubscription")}
          </Text>
        </AnimatedPressable>
      </View>

      <AppearanceModal
        visible={showAppearance}
        icon={f.icon}
        color={f.color}
        name={f.name}
        onChange={(icon, color) => {
          u("icon", icon);
          u("color", color);
        }}
        onClose={() => setShowAppearance(false)}
      />
    </Animated.View>
  );

  return (
    <TrueSheet
      ref={setRefs}
      detents={[1]}
      grabber={false}
      cornerRadius={24}
      dismissible={false}
      dimmed={true}
      dimmedDetentIndex={0}
      scrollable
      backgroundColor={C.bg}
      onWillPresent={handlePresent}
      onDidDismiss={() => {
        setPhase("pick");
        setQuery("");
        setF({ ...DEFAULT_FORM });
        setCycleOpen(false);
        setCategoryOpen(false);
        setReminderOpen(false);
        setShowAppearance(false);
      }}
    >
      {/* Custom grabber */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            width: 40,
            height: 4,
            borderRadius: 99,
            marginTop: 8,
            marginBottom: 4,
          }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {phase === "pick" ? renderPicker() : renderForm()}
      </KeyboardAvoidingView>
    </TrueSheet>
  );
});

export default AddSubSheet;

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: C.t1,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: R.pill,
    backgroundColor: C.bgSub,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bgSub,
    borderRadius: R.md,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: C.t1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.t3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surfaceElevated,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    padding: 12,
    marginBottom: 8,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: R.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  serviceIconShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: R.sm,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: C.t1,
  },
  serviceCat: {
    fontSize: 12,
    color: C.t3,
    marginTop: 2,
  },
  addCircle: {
    width: 36,
    height: 36,
    borderRadius: R.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyBottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  customBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.line,
    borderRadius: R.md,
  },
  customBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.t2,
  },
  // ─── Form styles ───
  inp: {
    backgroundColor: C.bgSub,
    borderRadius: R.md,
    padding: 14,
    fontSize: 16,
    fontWeight: "500",
    color: C.t1,
  },
  dollarRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgSub,
    borderRadius: R.md,
    paddingLeft: 14,
  },
  dollarSign: {
    fontSize: 18,
    color: C.t3,
    fontWeight: "500",
  },
  selectBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.bgSub,
    borderRadius: R.pill,
    padding: 14,
  },
  priceCycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cyclePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.bgSub,
    borderRadius: R.pill,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  popupCard: {
    width: "85%",
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.t1,
    marginBottom: 12,
    textAlign: "center",
  },
  popupItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: R.md,
    marginBottom: 2,
  },
  customCycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bgSub,
    borderRadius: R.md,
    padding: 10,
    marginTop: 8,
  },
  segRow: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: C.bgSub,
    borderRadius: R.pill,
    padding: 2,
  },
  seg: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: R.pill,
    alignItems: "center",
  },
  segActive: { backgroundColor: C.black },
  segTxt: { fontSize: 12, fontWeight: "600", color: C.t3 },
  segTxtActive: { color: "#fff" },
  appearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 12,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trialBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: R.md,
    marginBottom: 0,
  },
  trialLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  trialDaysRow: {
    backgroundColor: C.redBg,
    borderBottomLeftRadius: R.md,
    borderBottomRightRadius: R.md,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 20,
  },
  trialDayBtn: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    borderRadius: R.md,
    alignItems: "center",
    backgroundColor: C.bgSub,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
  },
  workPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  saveBtn: {
    borderRadius: R.pill,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
});
