import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';

const CategoryItem = ({ label, icon, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.container, isSelected && styles.containerSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon ? (
      <>
        <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
          {label}
        </Text>
      </>
    ) : (
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: spacing.lg,
    minWidth: 72,
  },
  containerSelected: {},
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconCircleSelected: {
    backgroundColor: colors.accent,
  },
  icon: {
    fontSize: 26,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.accent,
  },
});

export default CategoryItem;
