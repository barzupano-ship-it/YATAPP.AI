import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProfile, useI18n } from '../context';
import { Colors, Spacing } from '../constants/theme';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const { notifications, updateNotifications } = useProfile();

  const toggle = (key: keyof typeof notifications, value: boolean) => {
    updateNotifications({ [key]: value });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('back')}</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>{t('notificationsTitle')}</Text>
        <Text style={styles.subtitle}>{t('manageAlerts')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('newOrders')}</Text>
          <Switch
            value={notifications.newOrders}
            onValueChange={(v) => toggle('newOrders', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('deliveryUpdates')}</Text>
          <Switch
            value={notifications.deliveryUpdates}
            onValueChange={(v) => toggle('deliveryUpdates', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('earningsAlerts')}</Text>
          <Switch
            value={notifications.earningsAlerts}
            onValueChange={(v) => toggle('earningsAlerts', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{t('promotions')}</Text>
          <Switch
            value={notifications.promotions}
            onValueChange={(v) => toggle('promotions', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>
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
  section: {
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 16, color: Colors.text },
  backButton: { padding: Spacing.lg, paddingBottom: 0 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
});
