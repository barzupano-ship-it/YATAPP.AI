import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { Order } from '../context';
import { useDelivery, useCity } from '../context';
import { OrderCard } from '../components/OrderCard';
import { useAvailableOrders } from '../hooks/useAvailableOrders';
import { acceptOrder as acceptOrderApi } from '../services/orderService';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useI18n } from '../context';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { acceptOrder } = useDelivery();
  const { city, setCity, cities } = useCity();
  const { orders, loading, error, refresh } = useAvailableOrders();
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = useMemo(() => {
    const q = (citySearch || '').trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch, cities]);

  const handleAcceptOrder = async (order: Order) => {
    if (USE_API) {
      try {
        const accepted = await acceptOrderApi(order.id);
        if (accepted) {
          acceptOrder(accepted);
          navigation.navigate('ActiveDelivery');
        }
      } catch {
        // Show error - for now just ignore
      }
    } else {
      acceptOrder(order);
      navigation.navigate('ActiveDelivery');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('availableOrders')}</Text>
          <Text style={styles.subtitle}>{t('acceptOrdersHint')}</Text>
        </View>
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setCityModalVisible(true)}
          activeOpacity={0.7}>
          <Ionicons name="location" size={18} color={Colors.primary} />
          <Text style={styles.cityButtonText}>{city}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal visible={cityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectCity')}</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder={t('searchCity')}
              placeholderTextColor={Colors.textSecondary}
            />
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, city === item && styles.cityItemSelected]}
                  onPress={() => {
                    setCity(item);
                    setCityModalVisible(false);
                    setCitySearch('');
                  }}>
                  <Text style={styles.cityItemText}>{item}</Text>
                  {city === item && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.cityList}
            />
          </View>
        </View>
      </Modal>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} onAccept={() => handleAcceptOrder(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={USE_API ? <RefreshControl refreshing={loading} onRefresh={refresh} /> : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>{t('noOrdersAvailable')}</Text>
            <Text style={styles.emptySubtext}>{t('checkBackSoon')}</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchInput: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    color: Colors.text,
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cityItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  cityItemText: {
    fontSize: 16,
    color: Colors.text,
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
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
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
  loading: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorBar: {
    padding: Spacing.md,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
});
