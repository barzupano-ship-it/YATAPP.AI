import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../constants/theme';
import { useI18n } from '../context';

export function HelpSupportScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const faqItems = [
    { q: t('faqAcceptOrder'), a: t('faqAcceptOrderAnswer') },
    { q: t('faqCompleteDelivery'), a: t('faqCompleteDeliveryAnswer') },
    { q: t('faqWhenPaid'), a: t('faqWhenPaidAnswer') },
    { q: t('faqContact'), a: t('faqContactAnswer') },
  ];
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const openSupport = () => {
    Linking.openURL('https://t.me/delivery_support').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('back')}</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>{t('helpSupportTitle')}</Text>
        <Text style={styles.subtitle}>{t('findAnswers')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('faq')}</Text>
        {faqItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            activeOpacity={0.7}
          >
            <Text style={styles.faqQuestion}>{item.q}</Text>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('contactSupport')}</Text>
        <TouchableOpacity style={styles.contactButton} onPress={openSupport}>
          <Text style={styles.contactIcon}>✉️</Text>
          <Text style={styles.contactText}>{t('contactModeratorTelegram')}</Text>
          <Text style={styles.contactArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  section: { margin: Spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  faqItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: { fontSize: 16, fontWeight: '600', color: Colors.text },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: { fontSize: 24, marginRight: Spacing.md },
  contactText: { flex: 1, fontSize: 16, color: Colors.text },
  contactArrow: { fontSize: 18, color: Colors.primary },
  backButton: { padding: Spacing.lg, paddingBottom: 0 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
});
