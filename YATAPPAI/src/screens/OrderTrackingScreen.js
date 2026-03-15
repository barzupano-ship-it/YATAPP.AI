import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { OrderStatus } from '../components';
import { getOrderById, updateOrderReceipt } from '../services/orderService';
import { formatCurrency } from '../utils';
import { colors, spacing } from '../styles';

const TRACKING_STEPS = [
  'Заказ получен',
  'Подготовка',
  'Готов к выдаче',
  'Курьер забрал заказ',
  'В пути',
  'Доставлен',
];

const STATUS_TO_STEP = {
  pending: 0,
  accepted: 1,
  preparing: 1,
  ready: 2,
  picked_up: 3,
  delivering: 4,
  delivered: 5,
};

function MapEmbed({ uri, style }) {
  if (Platform.OS === 'web') {
    return (
      <iframe
        src={uri}
        style={{ width: '100%', height: 220, border: 0 }}
        title="Map"
      />
    );
  }
  const { WebView } = require('react-native-webview');
  return <WebView source={{ uri }} style={style} scrollEnabled={false} originWhitelist={['*']} />;
}

const STATUS_LABELS = {
  pending: 'Заказ принят и ожидает подтверждения ресторана.',
  accepted: 'Ресторан подтвердил заказ.',
  preparing: 'Ресторан готовит ваш заказ.',
  ready: 'Заказ готов и ожидает курьера.',
  picked_up: 'Курьер уже забрал заказ.',
  delivering: 'Курьер едет к вам.',
  delivered: 'Заказ успешно доставлен.',
  cancelled: 'Заказ был отменен.',
};

const OrderTrackingScreen = () => {
  const route = useRoute();
  const { t } = useLanguage();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError(t('orderNotFound'));
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadOrder = async (showLoader = false) => {
      if (showLoader && isActive) setLoading(true);
      try {
        const nextOrder = await getOrderById(orderId);
        if (!isActive) return;
        setOrder(nextOrder);
        setError('');
      } catch (err) {
        if (!isActive) return;
        setError(err?.message || t('loadOrderFailed'));
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadOrder(true);
    const intervalId = setInterval(() => {
      void loadOrder(false);
    }, 5000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [orderId]);

  const status = order?.status || 'pending';
  const currentStep = STATUS_TO_STEP[status] ?? 0;
  const currentStatus = STATUS_LABELS[status] || STATUS_LABELS.pending;
  const courierName = order?.courier_name || (order?.courier_id ? t('courierAssigned') : t('searchingCourier'));
  const courierPhone = order?.courier_phone || (order?.courier_id ? t('phoneNotAvailable') : t('phoneNotAvailable'));
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptUrl = order?.receipt_screen_url || order?.receiptScreenUrl || '';

  const pickReceiptImage = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(t('permissionRequired'), t('permissionPhotoLibrary'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
    if (!base64) {
      Alert.alert(t('uploadFailed'), t('uploadFailedHint'));
      return;
    }
    setUploadingReceipt(true);
    try {
      const updated = await updateOrderReceipt(orderId, base64);
      setOrder(updated);
    } catch (err) {
      Alert.alert(t('uploadFailed'), err?.message || t('uploadFailedHint'));
    } finally {
      setUploadingReceipt(false);
    }
  };
  const courierLat = order?.courier_latitude;
  const courierLng = order?.courier_longitude;
  const hasCourierLocation = courierLat != null && courierLng != null && Number.isFinite(courierLat) && Number.isFinite(courierLng);

  const deliveryLat = order?.delivery_latitude;
  const deliveryLng = order?.delivery_longitude;
  const deliveryAddr = order?.delivery_address || order?.deliveryAddress;

  const mapEmbedUrl = useMemo(() => {
    if (!hasCourierLocation) return null;
    const saddr = `${courierLat},${courierLng}`;
    if (deliveryLat != null && deliveryLng != null) {
      return `https://maps.google.com/maps?output=embed&saddr=${saddr}&daddr=${deliveryLat},${deliveryLng}`;
    }
    if (deliveryAddr?.trim()) {
      return `https://maps.google.com/maps?output=embed&saddr=${saddr}&daddr=${encodeURIComponent(deliveryAddr.trim())}`;
    }
    return `https://maps.google.com/maps?output=embed&q=${courierLat},${courierLng}`;
  }, [hasCourierLocation, courierLat, courierLng, deliveryLat, deliveryLng, deliveryAddr]);

  const mapHint = useMemo(() => {
    if (status === 'ready') return t('orderWaitingForCourier');
    if (status === 'picked_up' || status === 'delivering') {
      return hasCourierLocation ? t('courierLocationUpdating') : t('waitingCourierLocation');
    }
    if (status === 'delivered') return t('orderDelivered');
    if (status === 'cancelled') return t('orderCancelled');
    return t('orderProcessing');
  }, [status, hasCourierLocation, t]);

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loadingOrderStatus')}</Text>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{t('orderTrackingTitle')}</Text>
        <Text style={styles.orderId}>{t('orderNumber')} #{orderId}</Text>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>{t('currentStatus')}</Text>
            <Text style={styles.summaryValue}>{TRACKING_STEPS[currentStep]}</Text>
            <Text style={styles.summaryHint}>{currentStatus}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{currentStep + 1}/{TRACKING_STEPS.length}</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.mapLabel}>{t('courierLocation')}</Text>
          {mapEmbedUrl ? (
            <MapEmbed uri={mapEmbedUrl} style={styles.mapWebView} />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>📍</Text>
              <Text style={styles.mapHint}>{mapHint}</Text>
            </View>
          )}
          {mapEmbedUrl && (
            <Text style={styles.mapHintOverlay}>{mapHint}</Text>
          )}
        </View>

        <View style={styles.courierInfo}>
          <Text style={styles.courierLabel}>{t('courier')}</Text>
          <Text style={styles.courierName}>{courierName}</Text>
          <Text style={styles.courierPhone}>{courierPhone}</Text>
          {order?.courier_id && order?.delivery_fee != null && (
            <>
              <View style={styles.deliveryFeeRow}>
                <Text style={styles.deliveryFeeLabel}>{t('deliveryFeeAmount')}</Text>
                <Text style={styles.deliveryFeeValue}>{formatCurrency(order.delivery_fee)}</Text>
              </View>
              <Text style={styles.deliveryFeeHint}>{t('deliveryFeeCashHint')}</Text>
            </>
          )}
        </View>

        <View style={styles.receiptSection}>
          <Text style={styles.receiptTitle}>{t('receiptPhoto')}</Text>
          <Text style={styles.receiptHint}>{t('receiptPhotoHint')}</Text>
          {receiptUrl ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receiptUrl }} style={styles.receiptImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.receiptChangeBtn}
                onPress={pickReceiptImage}
                disabled={uploadingReceipt}
              >
                <Text style={styles.receiptChangeText}>
                  {uploadingReceipt ? t('uploading') : t('changePhoto')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.receiptUploadBtn}
              onPress={pickReceiptImage}
              disabled={uploadingReceipt}
            >
              <Text style={styles.receiptUploadIcon}>📷</Text>
              <Text style={styles.receiptUploadText}>
                {uploadingReceipt ? t('uploading') : t('addReceiptPhoto')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        <OrderStatus steps={TRACKING_STEPS} currentStep={currentStep} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  orderId: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryHint: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 220,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 193, 103, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 193, 103, 0.35)',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  mapContainer: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  mapWebView: {
    width: '100%',
    height: 220,
  },
  mapPlaceholder: {
    height: 160,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  mapIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  mapHint: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapHintOverlay: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.sm,
  },
  courierInfo: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  courierLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  courierPhone: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  deliveryFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deliveryFeeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deliveryFeeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deliveryFeeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  inlineError: {
    marginBottom: spacing.md,
    color: colors.error,
    fontSize: 13,
  },
  receiptSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  receiptHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  receiptUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  receiptUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  receiptUploadText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '500',
  },
  receiptPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  receiptImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  receiptChangeBtn: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  receiptChangeText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
});

export default OrderTrackingScreen;
