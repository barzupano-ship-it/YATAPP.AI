import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import { colors, spacing, borderRadius } from '../styles';
import { formatCurrency } from '../utils';

const MenuItemCard = ({ item, restaurantId, onPress, t }) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.9}>
    <Image
      source={{ uri: item.image || 'https://via.placeholder.com/100' }}
      style={styles.menuImage}
      resizeMode="cover"
    />
    <View style={styles.menuContent}>
      <Text style={styles.menuName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.menuPrice}>{formatCurrency(item.price)}</Text>
      <View style={styles.addRow}>
        <Text style={styles.viewDetail}>{t('viewDetails')}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.accentOrange} />
      </View>
    </View>
  </TouchableOpacity>
);

const RestaurantScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { restaurantId } = route.params || {};
  const { restaurant, categories, loading, error } = useRestaurantMenu(restaurantId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{error || t('restaurantNotFound')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: restaurant.image }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={colors.accent} />
            <Text style={styles.rating}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.deliveryTime}>{restaurant.deliveryTime} {t('min')}</Text>
        </View>
      </View>

      <Text style={styles.menuTitle}>{t('menu')}</Text>
      <FlatList
        data={categories}
        keyExtractor={(cat) => cat.id}
        renderItem={({ item: category }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {(category.items || []).map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurantId={restaurantId}
                t={t}
                onPress={() =>
                  navigation.navigate('FoodItemDetail', {
                    restaurantId,
                    itemId: item.id,
                  })
                }
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.menuList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.cardBackground,
  },
  info: {
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  rating: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textSecondary,
  },
  deliveryTime: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  menuList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuImage: {
    width: 110,
    height: 110,
    backgroundColor: colors.backgroundSecondary,
  },
  menuContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentOrange,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetail: {
    fontSize: 13,
    color: colors.accentOrange,
    fontWeight: '500',
    marginRight: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textSecondary,
  },
});

export default RestaurantScreen;
