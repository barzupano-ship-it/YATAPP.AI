import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { Button } from './Button';
import { useI18n } from '../context';
import type { Order } from '../context';

interface OrderCardProps {
  order: Order;
  onAccept: () => void;
}

const STATUS_KEYS: Record<string, string> = {
  pending: 'statusNewOrder',
  accepted: 'statusAcceptedByRestaurant',
  preparing: 'statusPreparing',
  ready: 'statusReadyForPickup',
};

export function OrderCard({ order, onAccept }: OrderCardProps) {
  const { t } = useI18n();
  const isReady = order.status === 'ready';
  const statusKey = STATUS_KEYS[order.status || 'pending'] || 'statusInProgress';
  const statusLabel = t(statusKey as any);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.restaurant}>{order.restaurant}</Text>
          <Text style={styles.status}>{statusLabel}</Text>
        </View>
        <Text style={styles.deliveryFee}>{order.deliveryFee}</Text>
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.label}>{t('pickup')}</Text>
        <Text style={styles.address}>{order.pickupAddress}</Text>
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.label}>{t('delivery')}</Text>
        <Text style={styles.address}>{order.deliveryAddress}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{order.distance}</Text>
      </View>
      <Button
        title={isReady ? t('acceptOrder') : t('waitingForRestaurant')}
        onPress={onAccept}
        disabled={!isReady}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  restaurant: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  status: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deliveryFee: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  addressRow: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: Colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 0,
  },
});
