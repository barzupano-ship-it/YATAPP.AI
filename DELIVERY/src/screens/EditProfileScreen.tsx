import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useI18n } from '../context';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Colors, Spacing } from '../constants/theme';

export function EditProfileScreen({ navigation }: { navigation: any }) {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigation.goBack();
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('back')}</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('editProfileTitle')}</Text>
            <Text style={styles.subtitle}>{t('updateAccountDetails')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('fullName')}
              placeholder={t('yourName')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              label={t('email')}
              placeholder="driver@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label={t('phone')}
              placeholder="+992 90 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Button
              title={saved ? t('saved') : t('saveChanges')}
              onPress={handleSave}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { flex: 1 },
  button: { marginTop: Spacing.md },
  backButton: { padding: Spacing.lg, paddingBottom: 0 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
});
