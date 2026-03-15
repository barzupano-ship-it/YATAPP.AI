import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  border: colors.profileBorder,
};

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleDone = () => {
    updateUser({
      name,
      email,
      phone,
      gender,
      dateOfBirth,
    });
    navigation.goBack();
  };

  const FieldRow = ({ label, value, onChangeText, ...inputProps }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={PROFILE_COLORS.textSecondary}
        {...inputProps}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile')}</Text>
        <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
          <Text style={styles.doneText}>{t('done')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <TouchableOpacity style={styles.cameraOverlay}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <FieldRow
            label={t('username')}
            value={name}
            onChangeText={setName}
            placeholder={t('enterUsername')}
          />
          <FieldRow
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('enterEmail')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FieldRow
            label={t('phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('enterPhone')}
            keyboardType="phone-pad"
          />
          <FieldRow
            label={t('gender')}
            value={gender}
            onChangeText={setGender}
            placeholder={t('enterGender')}
          />
          <FieldRow
            label={t('dateOfBirth')}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder={t('dateFormat')}
          />
        </View>
      </ScrollView>
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
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PROFILE_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PROFILE_COLORS.border,
  },
  label: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
    flex: 1,
    textAlign: 'right',
    padding: 0,
  },
});

export default EditProfileScreen;
