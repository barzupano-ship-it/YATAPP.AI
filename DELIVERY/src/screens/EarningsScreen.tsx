import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { EARNINGS_PER_ORDER } from '../services/mockData';
import { getCourierOrders } from '../services/orderService';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useI18n } from '../context';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function calcEarnings(orders: Record<string, unknown>[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let week = 0;
  let month = 0;

  for (const o of orders) {
    // Count by delivered_at: once courier delivered, earnings stay even if restaurant later cancels
    const deliveredAt = o.delivered_at ? new Date(o.delivered_at as string) : null;
    if (!deliveredAt) continue;
    const fee = typeof o.delivery_fee === 'number' ? o.delivery_fee : parseFloat(String(o.delivery_fee || 0)) || EARNINGS_PER_ORDER;
    if (deliveredAt >= todayStart) today += fee;
    if (deliveredAt >= weekStart) week += fee;
    if (deliveredAt >= monthStart) month += fee;
  }

  return { today, week, month };
}

export function EarningsScreen() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(USE_API);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(() => {
    if (!USE_API) {
      setLoading(false);
      return;
    }
    getCourierOrders({ includeHidden: true })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (orders.length === 0) setLoading(true);
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const { today, week, month } = calcEarnings(orders);
  const cards = [
    { label: t('todayEarnings'), value: today, icon: '📅' },
    { label: t('thisWeek'), value: week, icon: '📆' },
    { label: t('thisMonth'), value: month, icon: '💰' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('earnings')}</Text>
        <Text style={styles.subtitle}>{t('trackIncome')}</Text>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          <View style={styles.cards}>
            {cards.map((card, index) => (
              <View key={card.label} style={[styles.card, index < cards.length - 1 && styles.cardSpacing]}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
                <Text style={styles.cardValue}>{card.value.toFixed(0)} с.</Text>
              </View>
            ))}
          </View>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{t('quickTips')}</Text>
            <Text style={styles.summaryText}>• {t('peakHours')}</Text>
            <Text style={styles.summaryText}>• {t('acceptOrdersNear')}</Text>
            <Text style={styles.summaryText}>• {t('completeMoreForBonuses')}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  cards: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSpacing: {
    marginBottom: Spacing.md,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  summary: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
});
