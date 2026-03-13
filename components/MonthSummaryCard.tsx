import Card from '@/components/Card';
import { C } from '@/constants/design';
import { Category } from '@/store';
import { fmt } from '@/utils/calc';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  breakdown: { categoryId: string; amount: number }[];
  catMap: Record<string, Category>;
  totalMo: number;
  activeCount: number;
  prevMonthTotal: number | null;
}

export default function MonthSummaryCard({ breakdown, catMap, totalMo, activeCount, prevMonthTotal }: Props) {
  const delta = prevMonthTotal != null ? totalMo - prevMonthTotal : null;

  return (
    <Card>
      <View style={s.headerRow}>
        <Text style={s.sectionLabel}>SUMMARY</Text>
        <Text style={s.subLabel}>{activeCount} active subs</Text>
      </View>
      {breakdown.length > 0 && totalMo > 0 && (
        <View style={s.barContainer}>
          {breakdown.map(({ categoryId, amount }) => (
            <View
              key={categoryId}
              style={{
                flex: amount / totalMo,
                height: 6,
                backgroundColor: catMap[categoryId]?.color ?? C.t3,
                borderRadius: 3,
              }}
            />
          ))}
        </View>
      )}
      <View style={s.legend}>
        {breakdown.map(({ categoryId, amount }) => (
          <Text key={categoryId} style={s.legendItem}>
            <Text style={{ color: catMap[categoryId]?.color ?? C.t3 }}>●</Text>
            {' '}{catMap[categoryId]?.name ?? 'Other'} {fmt(amount)}
          </Text>
        ))}
      </View>
      {delta != null && (
        <View style={s.deltaRow}>
          <Text style={s.deltaText}>
            vs prev: <Text style={{ color: delta > 0 ? C.red : C.green, fontWeight: '600' }}>
              {delta > 0 ? '+' : ''}{fmt(delta)}
            </Text>
          </Text>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subLabel: {
    fontSize: 10, fontWeight: '500', color: C.t2,
  },
  barContainer: {
    flexDirection: 'row', gap: 3, height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  legendItem: {
    fontSize: 10, fontWeight: '500', color: C.t2,
  },
  deltaRow: {
    marginTop: 8, alignItems: 'flex-end',
  },
  deltaText: {
    fontSize: 10, color: C.t2,
  },
});
