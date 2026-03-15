import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles';
const FoodCard = ({ item, restaurant, rating, deliveryTime, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.imageWrap}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      {deliveryTime != null && (
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={10} color={colors.text} />
          <Text style={styles.badgeText}>{deliveryTime} min</Text>
        </View>
      )}
    </View>
    <View style={styles.content}>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {restaurant && (
        <Text style={styles.restaurant} numberOfLines={1}>
          {restaurant}
        </Text>
      )}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.accent} />
              <Text style={styles.rating}>{rating}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.addIcon} onPress={onPress}>
          <Ionicons name="add-circle" size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
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
    height: 120,
    backgroundColor: colors.backgroundSecondary,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restaurant: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  addIcon: {
    padding: spacing.xs,
  },
});

export default FoodCard;
