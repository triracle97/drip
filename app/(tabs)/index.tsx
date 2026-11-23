import AddSubSheet from "@/components/AddSubSheet";
import AnimatedPressable from "@/components/AnimatedPressable";
import Card from "@/components/Card";
import EditSubSheet from "@/components/EditSubSheet";
import IncomeSheet from "@/components/IncomeSheet";
import SubRow from "@/components/SubRow";
import Toast from "@/components/Toast";
import TrialSheet from "@/components/TrialSheet";
import { C, LAYOUT, R, SP, TS } from "@/constants/design";
import { Sub, useStore } from "@/store";
import { useSettings } from "@/store/settings";
import { useToday } from "@/hooks/useToday";
import {
  blended,
  daysLabel,
  daysSinceTrialEnd,
  fmt,
  nextChargeIn,
  subMo,
  toHrs,
  trialDaysLeft,
} from "@/utils/calc";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, useAnimatedRef } from "react-native-reanimated";
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItemInfo,
} from "react-native-sortables";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import type { Category } from "@/store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { subs, incomes, categories, reorderSubs } = useStore();
  const currency = useSettings((s) => s.currency);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [categories]);
  const [viewPeriod, setViewPeriod] = useState<"mo" | "yr">("mo");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [trialSheet, setTrialSheet] = useState<Sub | null>(null);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const addSheetRef = useRef<TrueSheet>(null);
  const incomeRef = useRef<TrueSheet>(null);

  const rate = blended(incomes);
  // Re-renders at midnight / on foreground so day counts and trial states stay current.
  const today = useToday();
  const isRunningTrial = useCallback(
    (s: Sub) =>
      s.active &&
      s.isTrial &&
      s.trialDecision === "pending" &&
      trialDaysLeft(s.trialEndDay, today) > 0,
    [today],
  );
  const activeTrials = useMemo(() => subs.filter(isRunningTrial), [subs, isRunningTrial]);
  // Paying subs: active and not in a running free trial (an undecided trial that has
  // ended is assumed to have converted, so it counts toward spend).
  const active = useMemo(
    () => subs.filter((s) => s.active && !isRunningTrial(s)),
    [subs, isRunningTrial],
  );
  const inactive = useMemo(() => subs.filter((s) => !s.active), [subs]);
  const totalMo = active.reduce((sum, s) => sum + subMo(s), 0);
  const displayTotal = viewPeriod === "yr" ? totalMo * 12 : totalMo;
  const totalIncomeMo = incomes.reduce((sum, i) => {
    return (
      sum +
      (i.isHourly ? i.amount * (i.hoursPerWeek || 10) * 4.33 : i.amount / 12)
    );
  }, 0);
  const pctIncome = totalIncomeMo > 0 ? (totalMo / totalIncomeMo) * 100 : 0;


  const displaySubs = useMemo(() => {
    // Single unified list: active trials + active regular + expired trials
    // This preserves sortOrder positions across trial → paid transitions
    const all = subs.filter((s) => s.active);
    const filtered = filterCat
      ? all.filter((s) => s.categoryId === filterCat)
      : all;
    return filtered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [subs, filterCat]);

  const isYr = viewPeriod === "yr";
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const keyOf = useCallback((s: Sub) => s.id, []);

  // Sortable.Grid keeps every row absolutely positioned on the UI thread, so the
  // store update after a drop only confirms the order the user already sees —
  // nothing re-lays out, nothing flickers.
  const handleDragEnd = useCallback(
    ({ data, fromIndex, toIndex }: SortableGridDragEndParams<Sub>) => {
      if (fromIndex === toIndex) return;
      const activeIds = data.map((s) => s.id);
      const shown = new Set(activeIds);
      // Keep subs that aren't in this list (cancelled / filtered out) after it.
      const otherIds = subs.filter((s) => !shown.has(s.id)).map((s) => s.id);
      reorderSubs([...activeIds, ...otherIds]);
    },
    [subs, reorderSubs],
  );

  const renderItem = useCallback(
    ({ item: s_ }: SortableGridRenderItemInfo<Sub>) => {
      // Trial card
      if (isRunningTrial(s_)) {
        const mc = subMo(s_);
        const daysLeft = trialDaysLeft(s_.trialEndDay, today);
        const displayCost = isYr ? mc * 12 : mc;
        return (
          <SubRow
            name={s_.name}
            icon={s_.icon}
            color={s_.color}
            costLabel={fmt(0)}
            variant="trial"
            trialDaysLeft={daysLeft}
            trialCostLabel={`Then ${fmt(displayCost)}/${isYr ? "yr" : "mo"}`}
            onPress={() => setTrialSheet(s_)}
          />
        );
      }
      // Regular card
      const mc = subMo(s_);
      const displayCost = isYr ? mc * 12 : mc;
      const remain = nextChargeIn(s_, today);
      const urgent = remain <= 3;
      const justEndedTrial =
        s_.isTrial &&
        s_.trialDecision === "pending" &&
        daysSinceTrialEnd(s_.trialEndDay, today) <= 5;
      return (
        <SubRow
          name={s_.name}
          icon={s_.icon}
          color={s_.color}
          costLabel={fmt(displayCost)}
          costSub={`/${isYr ? "year" : "month"}`}
          renewLabel={daysLabel(remain)}
          hoursLabel={toHrs(displayCost, rate)}
          urgent={urgent}
          trialJustEnded={justEndedTrial}
          onPress={() =>
            justEndedTrial ? setTrialSheet(s_) : setEditSubId(s_.id)
          }
        />
      );
    },
    // currency / t: fmt() and labels read them, rows must re-render when they change
    [isYr, rate, today, isRunningTrial, currency, t],
  );

  const ListHeader = useMemo(
    () => (
      <>
        {/* Compact Hero Summary Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={s.heroCard}>
            <View style={s.heroRow}>
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>{t("home.totalCost")}</Text>
                <Text style={s.heroStatValue}>{fmt(displayTotal)}</Text>
                <Text style={s.heroStatHint}>{active.length} active</Text>
              </View>
              <View style={s.heroDivider} />
              {incomes.length === 0 ? (
                <TouchableOpacity
                  onPress={() => incomeRef.current?.present()}
                  style={s.heroStat}
                  activeOpacity={0.7}
                >
                  <Text style={s.heroStatLabel}>{t("home.workHours")}</Text>
                  <View style={s.heroAddBtn}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5v14M5 12h14"
                        stroke="#fff"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                  <Text style={[s.heroStatHint, { color: C.green }]}>
                    {t("home.setIncome")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={s.heroStat}>
                  <Text style={s.heroStatLabel}>{t("home.workHours")}</Text>
                  <Text style={s.heroStatValue}>
                    {toHrs(displayTotal, rate)}
                  </Text>
                  <Text style={s.heroStatHint}>{t("home.toEarnThis")}</Text>
                </View>
              )}
              <View style={s.heroDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>{t("home.percentIncome")}</Text>
                <Text style={s.heroStatValue}>{pctIncome.toFixed(1)}%</Text>
                <Text style={s.heroStatHint}>{t("home.ofMonthly")}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Subscription List Header */}
        <View
          style={{
            marginBottom: 12,
            marginTop: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text style={s.subCount}>
            {t("home.subsCount", { count: displaySubs.length })}
            {activeTrials.length > 0 && (
              <Text style={s.trialCount}>
                {" "}
                · {t("home.trialsCount", { count: activeTrials.length })}
              </Text>
            )}
          </Text>
          {displaySubs.length > 0 && (
            <Text style={s.dragHint}>{t("home.holdToReorder")}</Text>
          )}
        </View>
      </>
    ),
    [
      displayTotal,
      active.length,
      incomes.length,
      rate,
      pctIncome,
      displaySubs.length,
      isYr,
      activeTrials,
      currency,
      t,
    ],
  );

  const ListFooter = useMemo(
    () => (
      <>
        {inactive.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.sectionCap, { marginBottom: 8 }]}>
              {t("home.cancelled")}
            </Text>
            {inactive.map((s_) => (
              <SubRow
                key={s_.id}
                name={s_.name}
                icon={s_.icon}
                color={s_.color}
                costLabel={fmt(s_.cost)}
                variant="inactive"
                onPress={() => setEditSubId(s_.id)}
              />
            ))}
          </View>
        )}
      </>
    ),
    [inactive, currency, t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z"
              fill="#177b9c"
            />
            <Circle cx="9" cy="15" r="2.5" fill="#3a9cbc" />
          </Svg>
          <Text style={s.wordmark}>Drip</Text>
        </View>
        <AnimatedPressable
          onPress={() => {
            addSheetRef.current?.present();
          }}
          style={s.addBtn}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </AnimatedPressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: LAYOUT.screenHPad,
          paddingBottom: LAYOUT.tabBarHeight + 128,
        }}
        showsVerticalScrollIndicator={false}
      >
        {ListHeader}
        <Sortable.Grid
          data={displaySubs}
          keyExtractor={keyOf}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          scrollableRef={scrollRef}
          columns={1}
          dragActivationDelay={250}
          activeItemScale={1.03}
          activeItemShadowOpacity={0.12}
          inactiveItemOpacity={1}
          inactiveItemScale={1}
          dropAnimationDuration={220}
          overDrag="vertical"
          hapticsEnabled
        />
        {ListFooter}
      </Animated.ScrollView>

      <TrialSheet sub={trialSheet} onClose={() => setTrialSheet(null)} />

      <EditSubSheet id={editSubId} onClose={() => setEditSubId(null)} />

      <AddSubSheet ref={addSheetRef} />

      <Toast message={toast} />
      <IncomeSheet ref={incomeRef} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: LAYOUT.screenHPad,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 50,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: "800",
    color: C.t1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: R.pill,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginTop: SP[1],
    paddingVertical: SP[3],
    paddingHorizontal: SP[3],
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    fontSize: TS.micro.fontSize,
    fontWeight: "600",
    color: C.t2,
    letterSpacing: TS.micro.letterSpacing,
    textTransform: "uppercase",
    marginBottom: SP[1],
  },
  heroStatValue: {
    fontSize: TS.subtitle.fontSize,
    fontWeight: "700",
    color: C.t1,
    letterSpacing: TS.subtitle.letterSpacing,
  },
  heroStatHint: {
    fontSize: TS.micro.fontSize,
    fontWeight: "400",
    color: C.t3,
    marginTop: 2,
  },
  heroAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  heroDivider: {
    width: 1,
    height: SP[5],
    backgroundColor: C.line,
  },
  sectionCap: {
    fontSize: 11,
    fontWeight: "600",
    color: C.t3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subCount: {
    fontSize: 15,
    fontWeight: "700",
    color: C.t1,
  },
  trialCount: {
    fontSize: 15,
    fontWeight: "600",
    color: C.t2,
  },
  dragHint: {
    fontSize: 11,
    fontWeight: "400",
    color: C.t3,
    marginTop: 2,
  },
});
