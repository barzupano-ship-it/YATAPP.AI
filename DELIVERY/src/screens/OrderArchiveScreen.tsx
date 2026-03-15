import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCourierOrders, hideOrderFromArchive } from '../services/orderService';
import { OrderArchiveCard, type ArchiveOrder } from '../components/OrderArchiveCard';
import { Colors, Spacing } from '../constants/theme';
import { useI18n } from '../context';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

const ARCHIVE_STATUSES = ['delivered', 'cancelled'];

function toArchiveOrder(o: Record<string, unknown>): ArchiveOrder {
  return {
    id: o.id as number | string,
    restaurant_name: (o.restaurant_name as string) || `Restaurant #${o.restaurant_id ?? '?'}`,
    delivery_address: (o.delivery_address as string) || '',
    status: typeof o.status === 'string' ? o.status : 'pending',
    delivery_fee: typeof o.delivery_fee === 'number' ? o.delivery_fee : Number(o.delivery_fee) || undefined,
    delivered_at: o.delivered_at as string | null | undefined,
    created_at: o.created_at as string | undefined,
    updated_at: o.updated_at as string | undefined,
    items: o.items as { menu_item_name?: string; quantity?: number }[] | undefined,
  };
}

export function OrderArchiveScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const [orders, setOrders] = useState<ArchiveOrder[]>([]);
  const [loading, setLoading] = useState(USE_API);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const handleDelete = async (orderId: string | number) => {
    if (!USE_API) return;
    setDeletingId(orderId);
    try {
      await hideOrderFromArchive(String(orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      setDeletingId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const load = (isRefresh = false) => {
    if (!USE_API) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    getCourierOrders()
      .then((list) => {
        const archive = list
          .filter((o) => ARCHIVE_STATUSES.includes(String(o.status || '').toLowerCase()))
          .map(toArchiveOrder)
          .sort((a, b) => {
            const da = a.delivered_at || a.updated_at || a.created_at || '';
            const db = b.delivered_at || b.updated_at || b.created_at || '';
            return new Date(db).getTime() - new Date(da).getTime();
          });
        setOrders(archive);
      })
      .catch(() => setOrders([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('orderArchive')}</Text>
        </View>
      </View>
      <View style={styles.subheader}>
        <Text style={styles.subtitle}>{t('orderArchiveSubtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderArchiveCard
              order={item}
              onDelete={USE_API ? handleDelete : undefined}
              deleting={deletingId === item.id}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            USE_API ? (
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t('noOrdersInArchive')}</Text>
              <Text style={styles.emptySubtext}>{t('completedOrdersAppearHere')}</Text>
            </View>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  back: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subheader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
