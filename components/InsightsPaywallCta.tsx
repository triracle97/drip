import { C, R } from '@/constants/design';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gem, Sparkles } from 'lucide-react-native';

interface Props {
  onPress: () => void;
}

export default function InsightsPaywallCta({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <View style={s.textContainer}>
          <Text style={s.title}>Unlock Smart Savings</Text>
          <Text style={s.desc}>Identify unused subscriptions and save up to $85/year</Text>
        </View>
        <Gem size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
      </View>
      <TouchableOpacity style={s.button} onPress={onPress} activeOpacity={0.85}>
        <Text style={s.buttonText}>Upgrade to Premium</Text>
        <Sparkles size={14} color="#2563EB" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: R.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
});
