import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { useI18n } from '../context';

export interface ArchiveOrder {
  id: number | string;
  restaurant_name: string;
  delivery_address: string;
  status: string;
  delivery_fee?: number;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: { menu_item_name?: string; quantity?: number }[];
}

interface OrderArchiveCardProps {
  order: ArchiveOrder;
  onDelete?: (orderId: string | number) => void;
  deleting?: boolean;
}

const STATUS_KEYS: Record<string, string> = {
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
};

export function OrderArchiveCard({ order, onDelete, deleting }: OrderArchiveCardProps) {
  const { t } = useI18n();
  const statusKey = STATUS_KEYS[order.status] || 'statusInProgress';
  const statusLabel = t(statusKey as 'statusDelivered' | 'statusCancelled' | 'statusInProgress');

  const dateStr = order.delivered_at || order.updated_at || order.created_at;
  const date = dateStr ? new Date(dateStr) : null;
  const dateFormatted = date
    ? date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const itemsStr =
    order.items?.map((i) => `${i.quantity || 1}x ${i.menu_item_name || 'Item'}`).join(', ') || '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.restaurant}>{order.restaurant_name}</Text>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.status,
                order.status === 'delivered' ? styles.statusDelivered : styles.statusCancelled,
              ]}>
              {statusLabel}
            </Text>
            <Text style={styles.date}>{dateFormatted}</Text>
          </View>
        </View>
        {order.status === 'delivered' && order.delivery_fee != null && (
          <Text style={styles.deliveryFee}>+{Number(order.delivery_fee).toFixed(0)} с.</Text>
        )}
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.label}>{t('delivery')}</Text>
        <Text style={styles.address}>{order.delivery_address}</Text>
      </View>
      {itemsStr ? (
        <View style={styles.itemsRow}>
          <Text style={styles.label}>{t('orderItems')}</Text>
          <Text style={styles.items} numberOfLines={2}>
            {itemsStr}
          </Text>
        </View>
      ) : null}
      {onDelete ? (
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={() => onDelete(order.id)}
          disabled={deleting}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteText}>{t('delete')}</Text>
        </TouchableOpacity>
      ) : null}
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
  statusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusDelivered: {
    color: '#059669',
  },
  statusCancelled: {
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  addressRow: {
    marginBottom: Spacing.xs,
  },
  itemsRow: {
    marginTop: Spacing.xs,
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
  items: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
