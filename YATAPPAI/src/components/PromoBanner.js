import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';

const PromoBanner = ({ code = 'FIRST50', onPress }) => (
  <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.content}>
      <Text style={styles.code}>Use code {code} at checkout</Text>
      <Text style={styles.hurry}>Hurry, offer ends soon!</Text>
      <Text style={styles.title}>Get 50% Off Your First Order!</Text>
    </View>
    <View style={styles.imagePlaceholder}>
      <Text style={styles.emoji}>🥗</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  code: {
    fontSize: 12,
    color: colors.background,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  hurry: {
    fontSize: 12,
    color: colors.background,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
  },
});

export default PromoBanner;
