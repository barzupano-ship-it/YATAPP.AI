import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAddress } from '../context/AddressContext';
import { formatAddressLine } from '../utils/address';
import { colors, spacing } from '../styles';

const PROFILE_COLORS = {
  primary: colors.profilePrimary,
  background: colors.profileBackground,
  text: colors.profileText,
  textSecondary: colors.profileTextSecondary,
  border: colors.profileBorder,
  card: colors.profileCard,
};

const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDefault,
  t,
}) => {
  const handleDelete = () => {
    Alert.alert(
      t('deleteAddress'),
      t('deleteAddressConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => onDelete(address.id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>{address.label}</Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>{t('default')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardAddress}>{formatAddressLine(address)}</Text>
        <Text style={styles.cardPhone}>{address.phone}</Text>
      </View>
      <View style={styles.cardActions}>
        {!isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSetDefault(address.id)}
          >
            <Text style={styles.actionText}>{t('setAsDefault')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={() => onEdit(address)}>
          <Ionicons name="pencil-outline" size={20} color={PROFILE_COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SavedAddressesScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } =
    useAddress();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={PROFILE_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('savedAddresses')}</Text>
        <View style={styles.headerButton} />
      </View>

      {addresses.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="location-outline" size={64} color={PROFILE_COLORS.textSecondary} />
          <Text style={styles.title}>{t('noSavedAddresses')}</Text>
          <Text style={styles.subtitle}>
            {t('addAddressHint')}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEditAddress')}
          >
            <Text style={styles.addButtonText}>{t('addAddress')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AddressCard
                address={item}
                isDefault={item.isDefault}
                onEdit={(addr) =>
                  navigation.navigate('AddEditAddress', { addressId: addr.id })
                }
                onDelete={removeAddress}
                onSetDefault={setDefaultAddress}
                t={t}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
          <TouchableOpacity
            style={styles.addButtonBottom}
            onPress={() => navigation.navigate('AddEditAddress')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t('addNewAddress')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  card: {
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: PROFILE_COLORS.border,
  },
  cardContent: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFILE_COLORS.text,
  },
  defaultBadge: {
    backgroundColor: PROFILE_COLORS.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: spacing.sm,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardAddress: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
    marginBottom: spacing.xs,
  },
  cardPhone: {
    fontSize: 14,
    color: PROFILE_COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: PROFILE_COLORS.primary,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  addButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROFILE_COLORS.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
});

export default SavedAddressesScreen;
