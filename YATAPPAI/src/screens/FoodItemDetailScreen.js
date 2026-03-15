import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { FOOD_ITEMS } from '../data';
import { getRestaurantMenuItem } from '../services/menuService';
import { colors, spacing, borderRadius } from '../styles';
import { formatCurrency } from '../utils';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/600x400?text=Food';

const AddOnCard = ({ addOn, onAdd, accentColor }) => (
  <TouchableOpacity style={styles.addOnCard} onPress={() => onAdd(addOn)} activeOpacity={0.8}>
    <Image source={{ uri: addOn.image }} style={styles.addOnImage} resizeMode="cover" />
    <TouchableOpacity
      style={[styles.addOnPlus, { backgroundColor: accentColor }]}
      onPress={() => onAdd(addOn)}
    >
      <Ionicons name="add" size={20} color={colors.white} />
    </TouchableOpacity>
    <Text style={styles.addOnName} numberOfLines={1}>
      {addOn.name}
    </Text>
    <Text style={[styles.addOnPrice, { color: accentColor }]}>
      {formatCurrency(addOn.price)}
    </Text>
  </TouchableOpacity>
);

const FoodItemDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { restaurantId, itemId } = route.params || {};

  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(!!itemId);

  useEffect(() => {
    let cancelled = false;

    const fallbackMenu = FOOD_ITEMS[restaurantId] || [];
    const fallbackItem =
      fallbackMenu.find((menuItem) => String(menuItem.id) === String(itemId)) ||
      fallbackMenu[0] ||
      null;

    if (!restaurantId || !itemId) {
      setItem(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!USE_API) {
      setItem(fallbackItem);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    getRestaurantMenuItem(restaurantId, itemId)
      .then((menuItem) => {
        if (!cancelled) {
          setItem(menuItem || fallbackItem);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const msg = error?.message || '';
        const isConnectionError =
          msg.includes('connect') || msg.includes('fetch') || msg.includes('network');
        setItem(isConnectionError ? fallbackItem : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, itemId]);

  const addOns = useMemo(() => item?.addOns || [], [item]);
  const totalPrice =
    (item?.price || 0) + selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  const handleAddAddOn = (addOn) => {
    setSelectedAddOns((prev) => [...prev, addOn]);
  };

  const handleAddToCart = () => {
    if (!item) return;
    const itemsToAdd = [
      { ...item, quantity: 1, restaurantId },
      ...selectedAddOns.map((a) => ({ ...a, quantity: 1, restaurantId })),
    ];
    itemsToAdd.forEach((i) => addToCart({ ...i, restaurantId }));
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('loading')}</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('itemNotFound')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.headerButton}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.accentOrange : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image || PLACEHOLDER_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {item.kcal != null && (
            <View style={styles.kcalBadge}>
              <Text style={styles.kcalText}>{item.kcal} kcal</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.itemName}>
            {item.name}
            {item.weight ? `, ${item.weight}` : ''}
          </Text>

          {item.ingredients && (
            <Text style={styles.ingredients}>{item.ingredients}</Text>
          )}

          {addOns.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('addToOrder')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.addOnsList}
              >
                {addOns.map((addOn) => (
                  <AddOnCard
                    key={addOn.id}
                    addOn={addOn}
                    onAdd={handleAddAddOn}
                    accentColor={colors.accentOrange}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        activeOpacity={0.9}
      >
        <Text style={styles.addToCartPrice}>{formatCurrency(totalPrice)}</Text>
        <Text style={styles.addToCartLabel}>{t('addToCart')}</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.cardBackground,
  },
  kcalBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.lg,
    backgroundColor: '#D4A574',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  kcalText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  itemName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  ingredients: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  addOnsList: {
    paddingBottom: spacing.lg,
  },
  addOnCard: {
    width: 100,
    marginRight: spacing.md,
  },
  addOnImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  addOnPlus: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  addOnPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentOrange,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  addToCartPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  addToCartLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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

export default FoodItemDetailScreen;
