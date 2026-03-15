import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders, cancelOrder } from '../services/orderService';
import { formatCurrency } from '../utils';
import { colors, spacing } from '../styles';

const HIDDEN_ORDERS_KEY = 'yatapp_hidden_order_ids';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  card: colors.profileCard,
  border: colors.profileBorder,
};

const STATUS_KEYS = {
  pending: 'orderStatusPending',
  accepted: 'orderStatusAccepted',
  preparing: 'orderStatusPreparing',
  ready: 'orderStatusReady',
  picked_up: 'orderStatusPickedUp',
  delivering: 'orderStatusDelivering',
  delivered: 'orderStatusDelivered',
  cancelled: 'orderStatusCancelled',
};

const CANCELLABLE_STATUSES = ['pending', 'accepted'];

const OrderCard = ({ order, onPress, onDelete, t, deleting }) => {
  const status = String(order.status || 'pending').toLowerCase();
  const statusLabel = t(STATUS_KEYS[status] || 'orderStatusPending');
  const restaurantName = order.restaurant_name || order.restaurantName || '—';
  const total = order.total_price ?? order.totalPrice ?? 0;

  return (
    <View style={styles.orderCard}>
      <TouchableOpacity
        style={styles.orderCardTouchable}
        onPress={() => onPress(order.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderCardHeader}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <View style={[styles.statusBadge, status === 'cancelled' && styles.statusCancelled]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurantName}
        </Text>
        <View style={styles.orderCardFooter}>
          <Text style={styles.orderTotal}>{formatCurrency(total)}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(order)}
        disabled={deleting}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

async function getHiddenOrderIds() {
  try {
    const json = await AsyncStorage.getItem(HIDDEN_ORDERS_KEY);
    const ids = json ? JSON.parse(json) : [];
    return new Set(Array.isArray(ids) ? ids.map(String) : []);
  } catch {
    return new Set();
  }
}

async function addHiddenOrderId(orderId) {
  try {
    const hidden = await getHiddenOrderIds();
    hidden.add(String(orderId));
    await AsyncStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify([...hidden]));
  } catch {}
}

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await getMyOrders();
      const hidden = await getHiddenOrderIds();
      const filtered = (Array.isArray(list) ? list : []).filter(
        (o) => !hidden.has(String(o.id))
      );
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = () => loadOrders(true);

  const [deletingId, setDeletingId] = useState(null);

  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderTracking', { orderId: String(orderId) });
  };

  const handleDelete = async (order) => {
    const status = String(order.status || 'pending').toLowerCase();
    const canCancel = CANCELLABLE_STATUSES.includes(status);
    const orderId = String(order.id);

    setDeletingId(orderId);
    try {
      if (canCancel) {
        await cancelOrder(order.id);
      }
      await addHiddenOrderId(orderId);
      setOrders((prev) => prev.filter((o) => String(o.id) !== orderId));
    } catch (err) {
      Alert.alert(t('deleteOrderFailed'), err?.message || t('deleteOrderFailedHint'));
    } finally {
      setDeletingId(null);
    }
  };

  const showBackButton = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
        <Text style={styles.headerTitle}>{t('myOrders')}</Text>
        <View style={styles.headerButton} />
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PROFILE_COLORS.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="receipt-outline" size={64} color={PROFILE_COLORS.textSecondary} />
          <Text style={styles.title}>{t('noOrdersYet')}</Text>
          <Text style={styles.subtitle}>{t('orderHistoryHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={handleOrderPress}
              onDelete={handleDelete}
              t={t}
              deleting={deletingId === String(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PROFILE_COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFILE_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.profileBorder,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
    overflow: 'hidden',
  },
  orderCardTouchable: {
    flex: 1,
    padding: spacing.md,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: PROFILE_COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 193, 103, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
    marginBottom: spacing.sm,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
  },
  deleteButton: {
    padding: spacing.md,
    marginRight: spacing.xs,
  },
});

export default OrdersScreen;
