import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  card: colors.profileCard,
  border: colors.profileBorder,
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { t, language, setLanguage, languages } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const currentLangLabel = languages.find((l) => l.code === language)?.label || language;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.content}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t('notifications')}</Text>
          <Ionicons name="chevron-forward" size={20} color={PROFILE_COLORS.textSecondary} />
        </View>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.optionLabel}>{t('language')}</Text>
          <Text style={styles.optionValue}>{currentLangLabel}</Text>
        </TouchableOpacity>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>{t('darkMode')}</Text>
          <Ionicons name="chevron-forward" size={20} color={PROFILE_COLORS.textSecondary} />
        </View>
      </View>

      <Modal visible={langModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                onPress={() => {
                  setLanguage(lang.code);
                  setLangModalVisible(false);
                }}
              >
                <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={22} color={PROFILE_COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  content: {
    padding: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PROFILE_COLORS.border,
  },
  optionLabel: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
  },
  optionValue: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: PROFILE_COLORS.background,
    borderRadius: 12,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
    marginBottom: spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  langOptionActive: {
    backgroundColor: PROFILE_COLORS.card,
  },
  langLabel: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
  },
  langLabelActive: {
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
  },
});

export default SettingsScreen;
