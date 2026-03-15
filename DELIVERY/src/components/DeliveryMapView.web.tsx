import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
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
  const saddr = `${courierLocation.latitude},${courierLocation.longitude}`;
  const daddr = destinationCoords
    ? `${destinationCoords.latitude},${destinationCoords.longitude}`
    : encodeURIComponent(destinationAddress);
  const googleMapsUrl =
    externalMapsUrl ||
    (destinationCoords
      ? `https://www.google.com/maps/dir/${saddr}/${destinationCoords.latitude},${destinationCoords.longitude}`
      : `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${encodeURIComponent(destinationAddress)}`);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?output=embed&saddr=${saddr}&daddr=${daddr}`;

  return (
    <View style={styles.container}>
      <View style={styles.mapCard}>
        <iframe
          title={t('deliveryRouteMap')}
          src={googleMapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </View>
      <View style={styles.detailsCard}>
        <Text style={styles.title}>{t('deliveryRouteMap')}</Text>
        <Text style={styles.subtitle}>
          {destinationCoords ? t('routeUsesLocationAndDestination') : t('routeUsesLocationAndAddress')}
        </Text>
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <Text style={styles.locationDot}>🟠</Text>
            <Text style={styles.locationText}>
              {t('you')}: {courierLocation.latitude.toFixed(4)}, {courierLocation.longitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationDot}>🟢</Text>
            <Text style={styles.locationText}>{destinationLabel}: {destinationAddress}</Text>
          </View>
        </View>
        {externalMapsUrl ? (
          <Text style={styles.savedLink} numberOfLines={2}>
            {externalMapsUrl}
          </Text>
        ) : null}
        <Button
          title={t('openInGoogleMaps')}
          onPress={() => Linking.openURL(googleMapsUrl)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: Spacing.lg,
  },
  mapCard: {
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  locations: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locationDot: {
    marginRight: Spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  savedLink: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
});
