import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDelivery, useI18n } from '../context';
import { Button } from '../components/Button';
import { updateOrderStatus as updateOrderStatusApi } from '../services/orderService';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { getRestaurantLocation } from '../services/restaurantService';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { activeDelivery, updateDeliveryStatus, completeDelivery } = useDelivery();
  const [processing, setProcessing] = useState(false);
  const [openingRestaurantLink, setOpeningRestaurantLink] = useState(false);

  if (!activeDelivery) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>{t('noActiveDelivery')}</Text>
          <Text style={styles.emptySubtext}>{t('acceptOrderToStart')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { order, status } = activeDelivery;
  const isAccepted = status === 'accepted';
  const isPickedUp = status === 'picked_up';
  const isDelivering = status === 'delivering';

  const handleNavigateToRestaurant = async () => {
    if (openingRestaurantLink) return;

    try {
      setOpeningRestaurantLink(true);

      if (order.restaurantId) {
        const restaurant = await getRestaurantLocation(order.restaurantId);
        if (restaurant?.googleMapsUrl) {
          await Linking.openURL(restaurant.googleMapsUrl);
          return;
        }
      }

      if (order.pickupLatitude != null && order.pickupLongitude != null) {
        await Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${order.pickupLatitude},${order.pickupLongitude}`
        );
        return;
      }

      navigation.getParent()?.navigate('DeliveryMap', { destination: 'restaurant' });
    } finally {
      setOpeningRestaurantLink(false);
    }
  };

  const handleNavigateToCustomer = () => {
    navigation.getParent()?.navigate('DeliveryMap', { destination: 'customer' });
  };

  const handlePickedUp = async () => {
    if (processing) return;
    try {
      setProcessing(true);
      if (USE_API) {
        await updateOrderStatusApi(order.id, 'picked_up');
      }
      updateDeliveryStatus('picked_up');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartDelivery = async () => {
    if (processing) return;
    try {
      setProcessing(true);
      if (USE_API) {
        await updateOrderStatusApi(order.id, 'delivering');
      }
      updateDeliveryStatus('delivering');
      handleNavigateToCustomer();
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (processing) return;
    try {
      setProcessing(true);
      if (USE_API) {
        await updateOrderStatusApi(order.id, 'delivered');
      }
      completeDelivery();
      navigation.navigate('AvailableOrders');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('activeDelivery')}</Text>
        <Text style={styles.deliveryFee}>{order.deliveryFee}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orderInfo')}</Text>
          <Text style={styles.restaurant}>{order.restaurant}</Text>

          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>📍 {t('restaurantPickup')}</Text>
            <Text style={styles.locationAddress}>{order.pickupAddress}</Text>
          </View>

          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>🏠 {t('customerDelivery')}</Text>
            <Text style={styles.locationAddress}>{order.deliveryAddress}</Text>
          </View>

          {order.items ? (
            <View style={styles.itemsBlock}>
              <Text style={styles.itemsLabel}>{t('orderItems')}</Text>
              <Text style={styles.itemsText}>{order.items}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            title={openingRestaurantLink ? t('openingGoogleMaps') : t('navigateToRestaurant')}
            onPress={() => {
              void handleNavigateToRestaurant();
            }}
            variant={isAccepted ? 'primary' : 'outline'}
            disabled={openingRestaurantLink}
            style={styles.actionButton}
          />
          <Button
            title={processing && isAccepted ? t('updating') : t('pickedUpOrder')}
            onPress={handlePickedUp}
            variant={isAccepted ? 'primary' : 'outline'}
            disabled={!isAccepted || processing}
            style={styles.actionButton}
          />
          <Button
            title={processing && isPickedUp ? t('starting') : t('startDelivery')}
            onPress={handleStartDelivery}
            variant={isPickedUp ? 'primary' : 'outline'}
            disabled={!isPickedUp || processing}
            style={styles.actionButton}
          />
          <Button
            title={processing && isDelivering ? t('completing') : t('completeDelivery')}
            onPress={handleCompleteDelivery}
            variant={isDelivering ? 'primary' : 'outline'}
            disabled={!isDelivering || processing}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  deliveryFee: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restaurant: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  locationBlock: {
    marginBottom: Spacing.md,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: Colors.text,
  },
  itemsBlock: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 15,
    color: Colors.text,
  },
  actions: {
    marginTop: Spacing.sm,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
