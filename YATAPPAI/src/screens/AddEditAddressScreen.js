import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocodeNominatim } from '../utils/reverseGeocode';
import { useAddress } from '../context/AddressContext';
import { useLanguage } from '../context/LanguageContext';
import { CITIES_TAJIKISTAN } from '../data/cities';
import { colors, spacing, borderRadius } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  border: colors.profileBorder,
};

const AddEditAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addAddress, updateAddress, addresses } = useAddress();
  const { t } = useLanguage();
  const editId = route.params?.addressId;

  const existing = editId ? addresses.find((a) => a.id === editId) : null;

  const [label, setLabel] = useState(existing?.label || '');
  const [street, setStreet] = useState(existing?.street || '');
  const [city, setCity] = useState(existing?.city || '');
  const [postalCode, setPostalCode] = useState(existing?.postalCode || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [latitude, setLatitude] = useState(existing?.latitude ?? null);
  const [longitude, setLongitude] = useState(existing?.longitude ?? null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(existing?.googleMapsUrl ?? '');
  const [locationLoading, setLocationLoading] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [manualCityEntry, setManualCityEntry] = useState(false);

  const filteredCities = useMemo(() => {
    const q = (citySearch || '').trim().toLowerCase();
    if (!q) return CITIES_TAJIKISTAN;
    return CITIES_TAJIKISTAN.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch]);

  useEffect(() => {
    if (existing?.city && !CITIES_TAJIKISTAN.includes(existing.city)) {
      setManualCityEntry(true);
    }
  }, [existing?.city]);

  const isValid = label.trim() && street.trim() && city.trim() && phone.trim();

  const handleUseMyLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access is needed to add your address.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = location.coords;
      setLatitude(lat);
      setLongitude(lng);
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      setGoogleMapsUrl(mapsLink);
      let address = null;
      if (Platform.OS !== 'web') {
        try {
          const [expoAddr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          address = expoAddr;
        } catch {
          address = null;
        }
      }
      if (!address) {
        address = await reverseGeocodeNominatim(lat, lng);
      }
      if (address) {
        if (address.street) setStreet(address.street);
        if (address.city) setCity(address.city);
        if (address.postalCode) setPostalCode(address.postalCode || '');
      }
    } catch (err) {
      Alert.alert('Unable to get location', err?.message || 'Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    const addressData = {
      label: label.trim(),
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      phone: phone.trim(),
    };
    if (latitude != null && longitude != null) {
      addressData.latitude = latitude;
      addressData.longitude = longitude;
    }
    if (googleMapsUrl.trim()) {
      addressData.googleMapsUrl = googleMapsUrl.trim();
    }
    if (editId) {
      updateAddress(editId, addressData);
    } else {
      addAddress(addressData);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editId ? t('editAddress') : t('addAddress')}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={!isValid}
        >
          <Text style={[styles.saveText, !isValid && styles.saveDisabled]}>
            {t('save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('label')}</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder={t('placeholderHome')}
          placeholderTextColor={PROFILE_COLORS.textSecondary}
        />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleUseMyLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={PROFILE_COLORS.primary} />
          ) : (
            <Ionicons name="location" size={20} color={PROFILE_COLORS.primary} />
          )}
          <Text style={styles.locationButtonText}>
            {locationLoading ? t('searchingAddress') : latitude != null ? t('locationSaved') : t('useMyLocation')}
          </Text>
        </TouchableOpacity>

        {googleMapsUrl ? (
          <View style={styles.mapsLinkBlock}>
            <Text style={styles.label}>Google Maps</Text>
            <Text style={styles.mapsUrlText} numberOfLines={2}>
              {googleMapsUrl}
            </Text>
            <TouchableOpacity
              style={styles.openMapsButton}
              onPress={() => Linking.openURL(googleMapsUrl)}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.openMapsButtonText}>Google Maps</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.label}>{t('street')}</Text>
        <TextInput
          style={styles.input}
          value={street}
          onChangeText={setStreet}
          placeholder="123 Main St, Apt 4"
          placeholderTextColor={PROFILE_COLORS.textSecondary}
        />

        <Text style={styles.label}>{t('city')}</Text>
        {manualCityEntry ? (
          <View>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder={t('placeholderCity')}
              placeholderTextColor={PROFILE_COLORS.textSecondary}
            />
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setManualCityEntry(false)}
            >
              <Text style={styles.linkText}>{t('selectCity')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.input, styles.cityPicker]}
              onPress={() => setCityModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityText, !city && styles.cityPlaceholder]}>
                {city || t('selectCity')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={PROFILE_COLORS.textSecondary} />
            </TouchableOpacity>

            <Modal visible={cityModalVisible} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('selectCity')}</Text>
                    <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                      <Ionicons name="close" size={24} color={PROFILE_COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    value={citySearch}
                    onChangeText={setCitySearch}
                    placeholder={t('searchCity')}
                    placeholderTextColor={PROFILE_COLORS.textSecondary}
                  />
                  <FlatList
                    data={[...filteredCities, '__OTHER__']}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.cityItem,
                          item !== '__OTHER__' && city === item && styles.cityItemSelected,
                        ]}
                        onPress={() => {
                          if (item === '__OTHER__') {
                            setManualCityEntry(true);
                            setCityModalVisible(false);
                            setCitySearch('');
                          } else {
                            setCity(item);
                            setCityModalVisible(false);
                            setCitySearch('');
                          }
                        }}
                      >
                        <Text style={styles.cityItemText}>
                          {item === '__OTHER__' ? t('otherCity') : item}
                        </Text>
                        {item !== '__OTHER__' && city === item && (
                          <Ionicons name="checkmark" size={20} color={PROFILE_COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                    style={styles.cityList}
                  />
                </View>
              </View>
            </Modal>
          </>
        )}

        <Text style={styles.label}>{t('postalCode')}</Text>
        <TextInput
          style={styles.input}
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder="10001"
          placeholderTextColor={PROFILE_COLORS.textSecondary}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 234 567 8900"
          placeholderTextColor={PROFILE_COLORS.textSecondary}
          keyboardType="phone-pad"
        />
      </ScrollView>
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
    borderBottomColor: PROFILE_COLORS.border,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
  },
  saveDisabled: {
    color: PROFILE_COLORS.textSecondary,
    opacity: 0.6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: PROFILE_COLORS.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: PROFILE_COLORS.text,
    marginBottom: spacing.lg,
  },
  cityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
    flex: 1,
  },
  cityPlaceholder: {
    color: PROFILE_COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PROFILE_COLORS.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: PROFILE_COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 16,
    color: PROFILE_COLORS.text,
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: PROFILE_COLORS.border,
  },
  cityItemSelected: {
    backgroundColor: colors.profileCard,
  },
  cityItemText: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
  },
  linkButton: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  linkText: {
    fontSize: 14,
    color: PROFILE_COLORS.primary,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: PROFILE_COLORS.background === '#FFFFFF' ? '#F5F5F5' : colors.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
  },
  mapsLinkBlock: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: PROFILE_COLORS.background === '#FFFFFF' ? '#F0F9FF' : 'rgba(6, 193, 103, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
  },
  mapsUrlText: {
    fontSize: 12,
    color: PROFILE_COLORS.textSecondary,
    marginBottom: spacing.sm,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: PROFILE_COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  openMapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddEditAddressScreen;
