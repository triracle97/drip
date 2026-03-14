import BrandLogo from '@/components/BrandLogo';
import Card from '@/components/Card';
import { C, R } from '@/constants/design';
import { Sub } from '@/store';
import { fmt, toHrs } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LifetimeEntry {
  sub: Sub;
  totalCost: number;
  monthsActive: number;
  startTimestamp?: number;
}

interface Props {
  entries: LifetimeEntry[];
  rate: number;
}

function IconContent({ icon, useOriginalColor }: { icon: string; useOriginalColor?: boolean }) {
  if (icon.startsWith('svg:')) {
    return <BrandLogo name={icon.slice(4)} size={18} color={useOriginalColor ? undefined : '#FFFFFF'} useOriginalColor={useOriginalColor} />;
  }
  return <Text style={{ fontSize: 14 }}>{icon}</Text>;
}

function sinceLabel(months: number, startTimestamp?: number): string {
  if (months < 1) return 'This month';
  if (startTimestamp) {
    const d = new Date(startTimestamp);
    const monthStr = d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
    return `Since ${monthStr} · ${Math.round(months)} months`;
  }
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
        {entries.map(({ sub, totalCost, monthsActive, startTimestamp }) => {
          const isWhiteBg = sub.color.toUpperCase() === '#FFFFFF' || sub.color.toUpperCase() === '#FFF';
          const hoursLabel = toHrs(totalCost, rate);
          const isHigh = totalCost > 0 && rate > 0 && totalCost / rate > 40;

          return (
            <View key={sub.id} style={s.row}>
              <View style={isWhiteBg && s.iconShadow}>
                <View style={[s.iconCircle, { backgroundColor: sub.color }]}>
                  <IconContent icon={sub.icon} useOriginalColor={isWhiteBg} />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.name} numberOfLines={1}>{sub.name}</Text>
                <Text style={s.duration}>{sinceLabel(monthsActive, startTimestamp)}</Text>
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
    fontSize: 10, fontWeight: '500', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subLabel: {
    fontSize: 10, fontWeight: '500', color: C.t3,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: R.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  iconShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
    borderRadius: R.sm,
  },
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
