import BrandLogo from '@/components/BrandLogo';
import Card from '@/components/Card';
import { C } from '@/constants/design';
import { Sub } from '@/store';
import { fmt, toHrs } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LifetimeEntry {
  sub: Sub;
  totalCost: number;
  monthsActive: number;
}

interface Props {
  entries: LifetimeEntry[];
  rate: number;
}

function IconContent({ icon }: { icon: string }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={18} useOriginalColor />;
  }
  return <Text style={{ fontSize: 14 }}>{icon}</Text>;
}

function sinceLabel(months: number): string {
  if (months < 1) return 'This month';
  return `${Math.round(months)} months`;
}

export default function LifetimeCostList({ entries, rate }: Props) {
  const grandTotal = entries.reduce((sum, e) => sum + e.totalCost, 0);

  return (
    <Card>
      <View style={s.headerRow}>
        <Text style={s.sectionLabel}>LIFETIME COST</Text>
        <Text style={s.subLabel}>Since first tracked</Text>
      </View>
      <View style={{ gap: 10, marginTop: 10 }}>
        {entries.map(({ sub, totalCost, monthsActive }) => {
          const isWhiteBg = sub.color.toUpperCase() === '#FFFFFF' || sub.color.toUpperCase() === '#FFF';
          const iconBg = isWhiteBg ? '#F5F5F5' : `${sub.color}15`;
          const hoursLabel = toHrs(totalCost, rate);
          const isHigh = totalCost > 0 && rate > 0 && totalCost / rate > 40;

          return (
            <View key={sub.id} style={s.row}>
              <View style={[s.iconCircle, { backgroundColor: iconBg }, isWhiteBg && s.iconBorder]}>
                <IconContent icon={sub.icon} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.name} numberOfLines={1}>{sub.name}</Text>
                <Text style={s.duration}>{sinceLabel(monthsActive)}</Text>
              </View>
              <View style={s.rightCol}>
                <Text style={s.cost}>{fmt(totalCost)}</Text>
                <Text style={[s.hours, isHigh && { color: C.red }]}>{hoursLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
      {entries.length > 0 && (
        <View style={s.footer}>
          <Text style={s.footerText}>
            All time: <Text style={{ fontWeight: '700', color: C.t1 }}>{fmt(grandTotal)}</Text>
            {' · '}
            <Text style={{ fontWeight: '700', color: C.gold }}>{toHrs(grandTotal, rate)}</Text>
          </Text>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subLabel: {
    fontSize: 10, fontWeight: '500', color: C.t3,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBorder: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  name: { fontSize: 13, fontWeight: '700', color: C.t1 },
  duration: { fontSize: 11, color: C.t3 },
  rightCol: { alignItems: 'flex-end' },
  cost: { fontSize: 15, fontWeight: '700', color: C.t1 },
  hours: { fontSize: 11, fontWeight: '500', color: C.t2 },
  footer: {
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line, alignItems: 'center',
  },
  footerText: {
    fontSize: 11, color: C.t2,
  },
});
