import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useI18n } from '../context';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Colors, Spacing } from '../constants/theme';

export function LoginScreen() {
  const { t, locale, setLocaleAndSave } = useI18n();
  const { requestCode, verifyCode, resetCodeRequest, codeSent, isLoading, useApiAuth, loginWithPassword } = useAuth();
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginWithPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('enterEmailAndPassword'));
      return;
    }
    setError('');
    try {
      await loginWithPassword(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
    }
  };

  const handleRequestCode = async () => {
    if (!contact.trim()) {
      setError(t('enterPhoneOrEmail'));
      return;
    }
    setError('');
    try {
      await requestCode(contact.trim());
    } catch {
      setError(t('failedToRequestCode'));
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError(t('enterTheCode'));
      return;
    }
    setError('');
    try {
      await verifyCode(code.trim(), contact.trim());
    } catch {
      setError(t('invalidCode'));
    }
  };

  const handleBack = () => {
    setCode('');
    setError('');
    resetCodeRequest();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.langRow}>
              {(['en', 'ru', 'tg'] as const).map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langBtn, code === locale && styles.langBtnActive]}
                  onPress={() => setLocaleAndSave(code)}
                >
                  <Text style={[styles.langBtnText, code === locale && styles.langBtnTextActive]}>
                    {code === 'en' ? t('english') : code === 'ru' ? t('russian') : t('tajik')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.logo}>🚴</Text>
            <Text style={styles.title}>{t('courierDelivery')}</Text>
            <Text style={styles.subtitle}>
              {codeSent
                ? t('enterCodeFromModerator')
                : t('signInToStart')}
            </Text>
          </View>

          <View style={styles.form}>
            {useApiAuth ? (
              <>
                <Input
                  label={t('email')}
                  placeholder="courier@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  label={t('password')}
                  placeholder={t('enterPassword')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Text style={styles.hint}>
                  {t('signInWithCourierAccount')}
                </Text>
              </>
            ) : !codeSent ? (
              <>
                <Input
                  label={t('phoneOrEmail')}
                  placeholder={t('phoneOrEmailPlaceholder')}
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Text style={styles.hint}>
                  {t('contactModeratorHint')}
                </Text>
              </>
            ) : (
              <>
                <Input
                  label={t('verificationCode')}
                  placeholder={t('enterCode')}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.hint}>
                  {t('enterCodeHint')}
                </Text>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={useApiAuth ? t('signIn') : codeSent ? t('verifyAndSignIn') : t('requestCode')}
              onPress={useApiAuth ? handleLoginWithPassword : codeSent ? handleVerifyCode : handleRequestCode}
              loading={isLoading}
              style={styles.button}
            />

            {codeSent && !useApiAuth && (
              <Button
                title={t('back')}
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  langBtnTextActive: {
    color: '#FFF',
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.md,
  },
});
