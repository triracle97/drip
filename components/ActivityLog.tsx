import Card from '@/components/Card';
import { C } from '@/constants/design';
import type { SubscriptionEvent } from '@/store/repository';
import { Sub } from '@/store';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  events: SubscriptionEvent[];
  subMap: Record<string, Sub>;
}

const EVENT_COLORS: Record<string, string> = {
  added: C.green,
  cancelled: C.red,
  reactivated: C.green,
  price_change: C.gold,
  cycle_change: C.gold,
};

function formatEventDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatEventText(event: SubscriptionEvent, subMap: Record<string, Sub>): string {
  const name = subMap[event.subscriptionId]?.name ?? 'Unknown';
  switch (event.type) {
    case 'added': return `Added ${name}`;
    case 'cancelled': return `Cancelled ${name}`;
    case 'reactivated': return `Reactivated ${name}`;
    case 'price_change': {
      const meta = event.metadata ? JSON.parse(event.metadata) : null;
      return meta ? `${name} price → $${meta.newCost}` : `${name} price changed`;
    }
    case 'cycle_change': return `${name} cycle changed`;
    default: return name;
  }
}

export default function ActivityLog({ events, subMap }: Props) {
  return (
    <Card>
      <Text style={s.sectionLabel}>ACTIVITY</Text>
      {events.length === 0 ? (
        <Text style={s.empty}>No changes this month</Text>
      ) : (
        <View style={{ gap: 10, marginTop: 10 }}>
          {events.map(evt => (
            <View key={evt.id} style={s.row}>
              <View style={[s.dot, { backgroundColor: EVENT_COLORS[evt.type] ?? C.t3 }]} />
              <Text style={s.text} numberOfLines={1}>{formatEventText(evt, subMap)}</Text>
              <Text style={s.date}>{formatEventDate(evt.timestamp)}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    fontSize: 10, fontWeight: '600', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  empty: {
    fontSize: 12, color: C.t3, textAlign: 'center', paddingVertical: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, flexShrink: 0,
  },
  text: {
    flex: 1, fontSize: 13, color: C.t2,
  },
  date: {
    fontSize: 11, fontWeight: '500', color: C.t3,
  },
});
