import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, CityProvider, DeliveryProvider, ProfileProvider, I18nProvider } from './src/context';
import { AppNavigator } from './src/navigation';
import { CourierLocationTracker } from './src/components/CourierLocationTracker';
import { Colors } from './src/constants/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
        <AuthProvider>
          <CityProvider>
            <DeliveryProvider>
              <CourierLocationTracker />
              <ProfileProvider>
                <AppNavigator />
                <StatusBar style="dark" backgroundColor={Colors.background} />
              </ProfileProvider>
            </DeliveryProvider>
          </CityProvider>
        </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
