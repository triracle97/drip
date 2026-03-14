import Card from '@/components/Card';
import { C } from '@/constants/design';
import { Sub } from '@/store';
import type { SubscriptionEvent } from '@/store/repository';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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

export default function ActivityLog({ events, subMap }: Props) {
  const { t } = useTranslation();
  return (
    <Card>
      <Text style={s.sectionLabel}>{t('activity.title')}</Text>
      {events.length === 0 ? (
        <Text style={s.empty}>{t('activity.noChanges')}</Text>
      ) : (
        <View style={{ gap: 10, marginTop: 10 }}>
          {events.map(evt => {
            const name = evt.subscriptionName ?? subMap[evt.subscriptionId]?.name ?? 'Unknown';
            const meta = evt.metadata ? JSON.parse(evt.metadata) : null;
            return (
              <View key={evt.id} style={s.row}>
                <View style={[s.dot, { backgroundColor: EVENT_COLORS[evt.type] ?? C.t3 }]} />
                <Text style={s.text} numberOfLines={1}>
                  {evt.type === 'added' && <>{t('activity.added')} <Text style={s.boldName}>{name}</Text></>}
                  {evt.type === 'cancelled' && <>{t('activity.cancelled')} <Text style={s.boldName}>{name}</Text></>}
                  {evt.type === 'reactivated' && <>{t('activity.reactivated')} <Text style={s.boldName}>{name}</Text></>}
                  {evt.type === 'price_change' && <><Text style={s.boldName}>{name}</Text> {t('activity.priceChange', { cost: meta?.newCost })}</>}
                  {evt.type === 'cycle_change' && <><Text style={s.boldName}>{name}</Text> {t('activity.cycleChange')}</>}
                </Text>
                <Text style={s.date}>{formatEventDate(evt.timestamp)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    fontSize: 10, fontWeight: '500', color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase',
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
  boldName: { fontWeight: '700', color: C.t1 },
});
