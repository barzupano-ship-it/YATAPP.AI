import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
};

const PaymentMethodsScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('paymentMethods')}</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.content}>
        <Ionicons name="card-outline" size={64} color={PROFILE_COLORS.textSecondary} />
        <Text style={styles.title}>{t('noPaymentMethods')}</Text>
        <Text style={styles.subtitle}>
          {t('addPaymentHint')}
        </Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>{t('addPaymentMethod')}</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomColor: colors.profileBorder,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  addButton: {
    marginTop: spacing.lg,
    backgroundColor: PROFILE_COLORS.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PaymentMethodsScreen;
