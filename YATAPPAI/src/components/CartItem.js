import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';
import { formatCurrency } from '../utils';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const { t } = useLanguage();
  const subtotal = item.price * item.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.price)} {t('each')}</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtotal}>{formatCurrency(subtotal)}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Text style={styles.removeText}>{t('remove')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  price: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    alignItems: 'flex-end',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.xs,
  },
  subtotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  removeText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
});

export default CartItem;
