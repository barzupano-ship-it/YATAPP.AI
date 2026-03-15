import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCity } from '../context/CityContext';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  SearchBar,
  RestaurantCard,
  FoodCard,
} from '../components';
import { useRestaurants } from '../hooks/useRestaurants';
import { colors, spacing, borderRadius } from '../styles';

const PROFILE_COLORS = {
  background: '#FFFFFF',
  text: '#1C1C1C',
  textSecondary: '#777777',
  border: '#E5E5E5',
  primary: colors.primary,
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { city, setCity, cities } = useCity();
  const { restaurants, loading, error } = useRestaurants(city);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = useMemo(() => {
    const q = (citySearch || '').trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch, cities]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurants;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q)
      );
    }
    return list;
  }, [restaurants, searchQuery]);

  const topPicks = useMemo(() => {
    return restaurants.slice(0, 5).map((r) => ({
      restaurant: r,
      item: { id: `${r.id}-1`, name: r.name, price: 0, image: r.image },
    }));
  }, [restaurants]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading && (
        <View style={styles.loadingBar}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('greeting')}</Text>
          <Text style={styles.greetingSubtitle}>{t('greetingSubtitle')}</Text>
          <Text style={styles.yourCityLabel}>{t('yourCity')}</Text>
          <TouchableOpacity
            style={styles.cityButton}
            onPress={() => setCityModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={18} color={colors.accent} />
            <Text style={styles.cityButtonText}>{city}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

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
                data={filteredCities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.cityItem, city === item && styles.cityItemSelected]}
                    onPress={() => {
                      setCity(item);
                      setCityModalVisible(false);
                      setCitySearch('');
                    }}
                  >
                    <Text style={styles.cityItemText}>{item}</Text>
                    {city === item && (
                      <Ionicons name="checkmark" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.cityList}
              />
            </View>
          </View>
        </Modal>

        <SearchBar
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>{t('topPicks')}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {topPicks.map(({ restaurant, item }) => (
              <FoodCard
                key={item.id}
                item={item}
                restaurant={restaurant.name}
                rating={restaurant.rating}
                deliveryTime={restaurant.deliveryTime}
                onPress={() =>
                  navigation.navigate('Restaurant', { restaurantId: restaurant.id })
                }
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>{t('bestChoice')}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.restaurantList}>
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={(r) =>
                  navigation.navigate('Restaurant', { restaurantId: r.id })
                }
              />
            ))}
          </View>
          {filteredRestaurants.length === 0 && (
            <Text style={styles.empty}>{t('noRestaurants')}</Text>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  yourCityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cityButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PROFILE_COLORS.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '400',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  restaurantList: {
    paddingHorizontal: spacing.lg,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  loadingBar: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorBar: {
    padding: spacing.md,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
});

export default HomeScreen;
