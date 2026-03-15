import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles';

const RestaurantCard = ({ restaurant, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(restaurant)}
    activeOpacity={0.9}
  >
    <View style={styles.imageWrap}>
      <Image source={{ uri: restaurant.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={12} color={colors.text} />
        <Text style={styles.ratingText}>{restaurant.rating}</Text>
      </View>
    </View>
    <View style={styles.content}>
      <Text style={styles.name} numberOfLines={1}>
        {restaurant.name}
      </Text>
      <Text style={styles.cuisine} numberOfLines={1}>
        {restaurant.cuisine}
      </Text>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.deliveryTime}>{restaurant.deliveryTime} min</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  imageWrap: {
    position: 'relative',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.backgroundSecondary,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cuisine: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default RestaurantCard;
