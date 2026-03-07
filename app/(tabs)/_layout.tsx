import { C } from '@/constants/design';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── SVG ICONS ─────────────────────────────
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5C12 2.5 5 10.5 5 15a7 7 0 1014 0c0-4.5-7-12.5-7-12.5z"
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={4} stroke={color} strokeWidth={1.5} />
    <Path d="M3 9.5h18" stroke={color} strokeWidth={1.5} />
    <Path d="M8 2.5v3M16 2.5v3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={8} cy={14} r={1.2} fill={color} />
    <Circle cx={12} cy={14} r={1.2} fill={color} />
    <Circle cx={16} cy={14} r={1.2} fill={color} />
  </Svg>
);

const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={color} strokeWidth={1.5} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InsightsIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TABS = [
  { id: 'index', label: 'Drip', Icon: HomeIcon },
  { id: 'calendar', label: 'Timeline', Icon: CalendarIcon },
  { id: 'insights', label: 'Insights', Icon: InsightsIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

// ─── CUSTOM TAB BAR ────────────────────────
function DripTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bg = Platform.OS === 'ios'
    ? undefined  // handled by BlurView
    : 'rgba(255,255,255,0.97)';

  const inner = (
    <View style={[s.row, { paddingBottom: insets.bottom || 16 }]}>
      {state.routes.map((route: any, idx: number) => {
        const tabDef = TABS.find(t => t.id === route.name) ?? TABS[0];
        const focused = state.index === idx;
        const color = focused ? C.black : C.t3;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={s.tab}
            activeOpacity={0.75}
          >
            <tabDef.Icon color={color} />
            <Text style={[s.label, { color, fontWeight: focused ? '600' : '500' }]}>
              {tabDef.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="light" style={s.bar}>
        <View style={s.topLine} />
        {inner}
      </BlurView>
    );
  }

  return (
    <View style={[s.bar, { backgroundColor: bg }]}>
      <View style={s.topLine} />
      {inner}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  topLine: {
    height: 1,
    backgroundColor: C.line,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});

// ─── LAYOUT ────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DripTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
