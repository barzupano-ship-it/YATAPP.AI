import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles';

const OrderStatus = ({ steps, currentStep }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Delivery progress</Text>
    <Text style={styles.subtitle}>Track each step of your order in real time.</Text>
    {steps.map((label, index) => {
      const isActive = index <= currentStep;
      const isLast = index === steps.length - 1;
      return (
        <View key={label} style={styles.row}>
          <View style={styles.left}>
            <View
              style={[
                styles.bullet,
                isActive ? styles.bulletActive : styles.bulletInactive,
              ]}
            >
              {isActive && <View style={styles.bulletInner} />}
            </View>
            {!isLast && <View style={[styles.line, isActive && styles.lineActive]} />}
          </View>
          <Text style={[styles.label, isActive && styles.labelActive]}>
            {label}
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 58,
  },
  left: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletActive: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bulletInactive: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  bulletInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingTop: 1,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
});

export default OrderStatus;
