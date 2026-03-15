import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  card: colors.profileCard,
  border: colors.profileBorder,
};

const OptionRow = ({ icon, iconColor, label, onPress, isLast }) => (
  <TouchableOpacity
    style={[profileStyles.optionRow, isLast && profileStyles.optionRowLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={profileStyles.optionLeft}>
      <View style={[profileStyles.iconCircle, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={profileStyles.optionLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={PROFILE_COLORS.textSecondary} />
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={profileStyles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={profileStyles.userHeader}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.9}
        >
          <View style={profileStyles.avatar}>
            <Text style={profileStyles.avatarText}>{initials}</Text>
          </View>
          <View style={profileStyles.userInfo}>
            <Text style={profileStyles.userName}>{user?.name || t('guest')}</Text>
            {user?.email && (
              <Text style={profileStyles.userEmail}>{user.email}</Text>
            )}
            {user?.isVip && (
              <View style={profileStyles.vipBadge}>
                <Ionicons name="diamond" size={12} color="#FFFFFF" />
                <Text style={profileStyles.vipText}>{t('vipMember')}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={PROFILE_COLORS.textSecondary}
          />
        </TouchableOpacity>

        <View style={profileStyles.sectionCard}>
          <OptionRow
            icon="receipt-outline"
            iconColor={PROFILE_COLORS.primary}
            label={t('orders')}
            onPress={() => navigation.navigate('Orders')}
          />
          <OptionRow
            icon="location-outline"
            iconColor="#3B82F6"
            label={t('savedAddresses')}
            onPress={() => navigation.navigate('SavedAddresses')}
          />
          <OptionRow
            icon="card-outline"
            iconColor="#3B82F6"
            label={t('paymentMethods')}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <OptionRow
            icon="settings-outline"
            iconColor={PROFILE_COLORS.text}
            label={t('settings')}
            onPress={() => navigation.navigate('Settings')}
            isLast
          />
        </View>

        <TouchableOpacity
          style={profileStyles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={profileStyles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFILE_COLORS.background,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PROFILE_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: PROFILE_COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
    marginTop: spacing.xs,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  vipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PROFILE_COLORS.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    color: PROFILE_COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileScreen;
