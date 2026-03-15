import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { CartItem, PrimaryButton } from '../components';
import { formatCurrency } from '../utils';
import { colors, spacing } from '../styles';

const CartScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('yourCart')}</Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('cartEmpty')}</Text>
          <Text style={styles.emptyHint}>{t('addItems')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('subtotal')}</Text>
              <Text style={styles.rowValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('deliveryFee')}</Text>
              <Text style={styles.rowValue}>{t('deliveryFeeWhenCourierAssigned')}</Text>
            </View>
            <Text style={styles.deliveryHint}>{t('deliveryFeeCashHint')}</Text>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('total')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
            <PrimaryButton
              title={t('checkout')}
              onPress={() => navigation.navigate('HomeTab', { screen: 'Checkout' })}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  deliveryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
});

export default CartScreen;
