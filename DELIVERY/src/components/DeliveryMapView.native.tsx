import React from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors, Spacing } from '../constants/theme';
import { Button } from './Button';
import { useI18n } from '../context';

interface DeliveryMapViewProps {
  courierLocation: { latitude: number; longitude: number };
  destinationCoords: { latitude: number; longitude: number } | null;
  destinationLabel: string;
  destinationAddress: string;
  externalMapsUrl?: string;
}

export default function DeliveryMapView({
  courierLocation,
  destinationCoords,
  destinationLabel,
  destinationAddress,
  externalMapsUrl,
}: DeliveryMapViewProps) {
  const { t } = useI18n();
  const routeCoordinates = destinationCoords
    ? [courierLocation, destinationCoords]
    : [courierLocation];
  const mapRegion = destinationCoords
    ? {
        latitude: (courierLocation.latitude + destinationCoords.latitude) / 2,
        longitude: (courierLocation.longitude + destinationCoords.longitude) / 2,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        ...courierLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

  const handleOpenInGoogleMaps = async () => {
    const saddr = `${courierLocation.latitude},${courierLocation.longitude}`;
    const webUrl =
      externalMapsUrl ||
      (destinationCoords
        ? `https://www.google.com/maps/dir/${saddr}/${destinationCoords.latitude},${destinationCoords.longitude}`
        : `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${encodeURIComponent(destinationAddress)}`);
    const nativeUrl =
      Platform.OS === 'ios'
        ? externalMapsUrl ||
          (destinationCoords
            ? `comgooglemaps://?saddr=${saddr}&daddr=${destinationCoords.latitude},${destinationCoords.longitude}&directionsmode=driving`
            : `comgooglemaps://?saddr=${saddr}&daddr=${encodeURIComponent(destinationAddress)}&directionsmode=driving`)
        : externalMapsUrl ||
          (destinationCoords
            ? `google.navigation:q=${destinationCoords.latitude},${destinationCoords.longitude}`
            : `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${encodeURIComponent(destinationAddress)}`);

    try {
      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpenNative ? nativeUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={false}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        <Marker
          coordinate={courierLocation}
          title={t('you')}
          description={t('courierLocation')}
          pinColor="orange"
        />
        {destinationCoords && (
          <>
            <Marker
              coordinate={destinationCoords}
              title={destinationLabel}
              description={destinationAddress}
              pinColor="green"
            />
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.primary}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          </>
        )}
      </MapView>
      <View style={styles.actions}>
        {externalMapsUrl ? (
          <Button
            title={t('showSavedGoogleMapsLink')}
            onPress={() => {
              void Linking.openURL(externalMapsUrl);
            }}
            variant="outline"
            style={styles.secondaryAction}
          />
        ) : null}
        <Button
          title={t('openInGoogleMaps')}
          onPress={() => {
            void handleOpenInGoogleMaps();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  actions: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  secondaryAction: {
    marginBottom: Spacing.sm,
  },
});
