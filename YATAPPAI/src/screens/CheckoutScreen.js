import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCart } from '../context/CartContext';
import { useAddress } from '../context/AddressContext';
import { useLanguage } from '../context/LanguageContext';
import { PrimaryButton } from '../components';
import { createOrder, updateOrderReceipt } from '../services/orderService';
import { getRestaurantById, buildPaymentMethodsFromRestaurant } from '../services/restaurantService';
import { formatCurrency } from '../utils';
import { formatAddressLine } from '../utils/address';
import { colors, spacing, borderRadius } from '../styles';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { items, total, clearCart } = useCart();
  const { addresses, defaultAddress } = useAddress();
  const { t } = useLanguage();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('alif');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'alif', labelKey: 'paymentAlif', detail: null },
    { id: 'dc', labelKey: 'paymentDc', detail: null },
  ]);

  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      setAddress(formatAddressLine(defaultAddress));
      setPhone(defaultAddress.phone || '');
    } else {
      setSelectedAddressId(null);
      setAddress('');
      setPhone('');
    }
  }, [defaultAddress?.id]);

  useEffect(() => {
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (addr) {
      setAddress(formatAddressLine(addr));
      setPhone(addr.phone || '');
    }
  }, [selectedAddressId]);

  const restaurantId = items.length > 0 ? items[0].restaurantId : null;
  useEffect(() => {
    setPaymentMethods([
      { id: 'alif', labelKey: 'paymentAlif', detail: null },
      { id: 'dc', labelKey: 'paymentDc', detail: null },
    ]);
    setPaymentMethod('alif');
    if (!restaurantId) return;
    getRestaurantById(restaurantId)
      .then((restaurant) => {
        const updated = buildPaymentMethodsFromRestaurant(restaurant);
        setPaymentMethods(updated);
        const first = updated[0];
        setPaymentMethod(first?.id || 'alif');
      })
      .catch(() => {
        setPaymentMethods([
          { id: 'alif', labelKey: 'paymentAlif', detail: null },
          { id: 'dc', labelKey: 'paymentDc', detail: null },
        ]);
        setPaymentMethod('alif');
      });
  }, [restaurantId]);

  const canPlace = address.trim() && phone.trim() && items.length > 0;

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
    setReceiptPhoto(base64);
  };

  const handlePlaceOrder = async () => {
    if (!canPlace) return;
    const restaurantIds = [...new Set(items.map((item) => item.restaurantId).filter(Boolean))];

    if (restaurantIds.length !== 1) {
      Alert.alert('Unable to place order', 'Please order from one restaurant at a time.');
      return;
    }

    try {
      setProcessing(true);
      const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
      const deliveryCoords =
        selectedAddr?.latitude != null && selectedAddr?.longitude != null
          ? { latitude: selectedAddr.latitude, longitude: selectedAddr.longitude }
          : null;
      const googleMapsUrl = selectedAddr?.googleMapsUrl?.trim() || null;
      const order = await createOrder(restaurantIds[0], address.trim(), items, deliveryCoords, googleMapsUrl);
      if (receiptPhoto && order?.id) {
        try {
          await updateOrderReceipt(String(order.id), receiptPhoto);
        } catch (receiptErr) {
          Alert.alert(t('uploadFailed'), receiptErr?.message || t('uploadFailedHint'));
        }
      }
      clearCart();
      navigation.replace('OrderTracking', { orderId: String(order?.id || '') });
    } catch (error) {
      Alert.alert('Order failed', error?.message || 'Could not place your order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>{t('checkoutTitle')}</Text>

      {addresses.length > 0 ? (
        <>
          <Text style={styles.label}>{t('deliveryAddress')}</Text>
          <View style={styles.addressSelector}>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressOption,
                  selectedAddressId === addr.id && styles.addressOptionActive,
                ]}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <View style={[styles.radio, selectedAddressId === addr.id && styles.radioActive]}>
                  {selectedAddressId === addr.id && <View style={styles.radioInner} />}
                </View>
                <View style={styles.addressOptionContent}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  <Text style={styles.addressText}>{formatAddressLine(addr)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addAddressLink}
            onPress={() =>
              navigation.navigate('Profile', {
                screen: 'SavedAddresses',
              })
            }
          >
            <Text style={styles.addAddressLinkText}>{t('addOrEditAddresses')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>{t('deliveryAddress')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('placeholderAddress')}
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <TouchableOpacity
            style={styles.addAddressLink}
            onPress={() =>
              navigation.navigate('Profile', {
                screen: 'SavedAddresses',
              })
            }
          >
            <Text style={styles.addAddressLinkText}>{t('addOrEditAddresses')}</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.label}>{t('phone')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholderPhone')}
        placeholderTextColor={colors.textSecondary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.sectionLabel}>{t('paymentMethods')}</Text>
      {paymentMethods.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[styles.paymentOption, paymentMethod === m.id && styles.paymentActive]}
          onPress={() => setPaymentMethod(m.id)}
        >
          <View style={[styles.radio, paymentMethod === m.id && styles.radioActive]}>
            {paymentMethod === m.id && <View style={styles.radioInner} />}
          </View>
          <View style={styles.paymentOptionContent}>
            <Text style={[styles.paymentLabel, paymentMethod === m.id && styles.paymentLabelActive]}>
              {t(m.labelKey)}
            </Text>
            {m.detail && (
              <Text style={styles.paymentDetail} selectable>{m.detail}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>{t('receiptPhoto')}</Text>
      <Text style={styles.receiptHint}>{t('receiptPhotoHint')}</Text>
      {receiptPhoto ? (
        <View style={styles.receiptPreview}>
          <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} resizeMode="cover" />
          <TouchableOpacity style={styles.receiptChangeBtn} onPress={pickReceiptImage}>
            <Text style={styles.receiptChangeText}>{t('changePhoto')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.receiptUploadBtn} onPress={pickReceiptImage}>
          <Text style={styles.receiptUploadIcon}>📷</Text>
          <Text style={styles.receiptUploadText}>{t('addReceiptPhoto')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.deliveryNotice}>
        <Text style={styles.deliveryNoticeText}>{t('deliveryFeeNotice')}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t('orderSummary')}</Text>
      <View style={styles.summary}>
        {items.map((item) => (
          <View key={item.id} style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              {item.name} × {item.quantity}
            </Text>
            <Text style={styles.summaryPrice}>
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
          <Text style={styles.summaryPrice}>{t('deliveryFeeWhenCourierAssigned')}</Text>
        </View>
        <Text style={styles.deliveryFeeHint}>{t('deliveryFeeCashHint')}</Text>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>{t('orderTotal')}</Text>
          <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <PrimaryButton
        title={processing ? t('placingOrder') : t('placeOrder')}
        onPress={handlePlaceOrder}
        disabled={!canPlace || processing}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  addressSelector: {
    marginBottom: spacing.sm,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.cardBackground,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  addressOptionContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addAddressLink: {
    marginBottom: spacing.lg,
  },
  addAddressLinkText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  deliveryNotice: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  deliveryNoticeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentActive: {
    borderColor: colors.accent,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 16,
    color: colors.text,
  },
  paymentLabelActive: {
    fontWeight: '600',
    color: colors.accent,
  },
  paymentDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  receiptUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
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
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
  },
  receiptChangeBtn: {
    padding: spacing.md,
    alignItems: 'center',
  },
  receiptChangeText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  summary: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryItem: {
    fontSize: 15,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  deliveryFeeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
});

export default CheckoutScreen;
