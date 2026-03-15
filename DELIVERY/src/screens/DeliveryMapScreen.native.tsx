import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDelivery, useI18n } from '../context';
import DeliveryMapView from '../components/DeliveryMapView.native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Button } from '../components/Button';
import { getRestaurantLocation } from '../services/restaurantService';

const MOCK_COURIER_POSITION = {
  latitude: 37.7835,
  longitude: -122.4115,
};

export function DeliveryMapScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { activeDelivery } = useDelivery();
  const [courierLocation, setCourierLocation] = useState(MOCK_COURIER_POSITION);
  const [locationErrorKey, setLocationErrorKey] = useState<string | null>(null);
  const [restaurantCoords, setRestaurantCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [restaurantGoogleMapsUrl, setRestaurantGoogleMapsUrl] = useState<string | null>(null);
  const [restaurantCoordsLoading, setRestaurantCoordsLoading] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationErrorKey('locationPermissionDenied');
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCourierLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationErrorKey(null);
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 20,
          },
          (loc) => {
            setCourierLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (err) {
        setLocationErrorKey('unableToGetLocation');
      }
    };

    setupLocation();
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!activeDelivery) {
      setRestaurantCoords(null);
      setRestaurantGoogleMapsUrl(null);
      setRestaurantCoordsLoading(false);
      return;
    }

    const { order } = activeDelivery;
    const needsRestaurantCoords =
      order.pickupLatitude == null &&
      order.pickupLongitude == null &&
      Boolean(order.restaurantId);

    if (!needsRestaurantCoords) {
      setRestaurantCoords(null);
      setRestaurantGoogleMapsUrl(null);
      setRestaurantCoordsLoading(false);
      return;
    }

    let cancelled = false;
    setRestaurantCoordsLoading(true);

    getRestaurantLocation(order.restaurantId!)
      .then((restaurant) => {
        if (cancelled) return;
        setRestaurantGoogleMapsUrl(restaurant?.googleMapsUrl ?? null);
        if (restaurant?.latitude != null && restaurant.longitude != null) {
          setRestaurantCoords({
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });
        } else {
          setRestaurantCoords(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurantCoords(null);
          setRestaurantGoogleMapsUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) setRestaurantCoordsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeDelivery]);

  if (!activeDelivery) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>{t('noActiveDelivery')}</Text>
          <Text style={styles.emptySubtext}>{t('acceptOrderToSeeMap')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { order } = activeDelivery;
  const destination = route.params?.destination === 'customer' ? 'customer' : 'restaurant';
  const destinationCoords =
    destination === 'customer'
      ? order.deliveryLatitude != null && order.deliveryLongitude != null
        ? {
            latitude: order.deliveryLatitude,
            longitude: order.deliveryLongitude,
          }
        : null
      : order.pickupLatitude != null && order.pickupLongitude != null
        ? {
            latitude: order.pickupLatitude,
            longitude: order.pickupLongitude,
          }
        : restaurantCoords;
  const destinationLabel =
    destination === 'customer' ? 'Customer delivery' : order.restaurant;
  const destinationAddress =
    destination === 'customer' ? order.deliveryAddress : order.pickupAddress;

  const hasAddressForMap = Boolean(destinationAddress?.trim());
  const loadingForThisDestination =
    destination === 'restaurant' && restaurantCoordsLoading;
  const canShowMap =
    destinationCoords != null ||
    (hasAddressForMap && !loadingForThisDestination);

  if (!canShowMap) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>
            {loadingForThisDestination
              ? t('loadingRestaurantLocation')
              : t('mapUnavailable')}
          </Text>
          <Text style={styles.emptySubtext}>
            {loadingForThisDestination ? t('pleaseWait') : t('locationDataMissing')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.mapBackButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('back')}</Text>
      </TouchableOpacity>
      <DeliveryMapView
        courierLocation={courierLocation}
        destinationCoords={destinationCoords}
        destinationLabel={destinationLabel}
        destinationAddress={destinationAddress}
        externalMapsUrl={
          destination === 'restaurant'
            ? restaurantGoogleMapsUrl ?? undefined
            : order.deliveryGoogleMapsUrl ?? undefined
        }
      />
      <View style={styles.overlay}>
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>
            {destination === 'customer' ? t('routeToCustomer') : t('routeToRestaurant')}
          </Text>
          <Text style={styles.etaValue}>{order.estimatedTime || '~15 min'}</Text>
        </View>
        {locationErrorKey && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{t(locationErrorKey as any)}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  overlay: { position: 'absolute', top: Spacing.lg, left: Spacing.lg, right: Spacing.lg },
  etaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  etaValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  errorBanner: { marginTop: Spacing.sm, backgroundColor: '#FEE2E2', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  errorText: { fontSize: 12, color: Colors.error, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  openMapsButton: { marginTop: Spacing.lg },
  backButton: { padding: Spacing.lg, paddingBottom: 0 },
  mapBackButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
});
