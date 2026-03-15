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
import { useProfile, useI18n } from '../context';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Colors, Spacing } from '../constants/theme';

export function VehicleInfoScreen({ navigation }: { navigation: any }) {
  const { t } = useI18n();
  const { vehicle, updateVehicle } = useProfile();
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year);
  const [plateNumber, setPlateNumber] = useState(vehicle.plateNumber);
  const [color, setColor] = useState(vehicle.color);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateVehicle({
      make: make.trim(),
      model: model.trim(),
      year: year.trim(),
      plateNumber: plateNumber.trim(),
      color: color.trim(),
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
            <Text style={styles.title}>{t('vehicleInformation')}</Text>
            <Text style={styles.subtitle}>{t('vehicleDetails')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('make')}
              placeholder="Toyota, Honda, etc."
              value={make}
              onChangeText={setMake}
            />
            <Input
              label={t('model')}
              placeholder="Camry, Civic, etc."
              value={model}
              onChangeText={setModel}
            />
            <Input
              label={t('year')}
              placeholder="2020"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
            <Input
              label={t('plateNumber')}
              placeholder="12345 ABC"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
            <Input
              label={t('color')}
              placeholder="White, Black, etc."
              value={color}
              onChangeText={setColor}
            />
            <Button
              title={saved ? t('saved') : t('saveVehicleInfo')}
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
  backButton: { padding: Spacing.lg, paddingBottom: 0 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
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
