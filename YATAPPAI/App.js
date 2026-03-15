import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { AddressProvider } from './src/context/AddressContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { CityProvider } from './src/context/CityContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AddressProvider>
            <CityProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <AppNavigator />
            </NavigationContainer>
            </CityProvider>
          </AddressProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
