import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import {
  HomeScreen,
  RestaurantScreen,
  FoodItemDetailScreen,
  CartScreen,
  CheckoutScreen,
  OrderTrackingScreen,
  ProfileScreen,
  EditProfileScreen,
  OrdersScreen,
  SavedAddressesScreen,
  AddEditAddressScreen,
  PaymentMethodsScreen,
  SettingsScreen,
} from '../screens';
import { colors } from '../styles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Restaurant" component={RestaurantScreen} />
    <Stack.Screen name="FoodItemDetail" component={FoodItemDetailScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersList" component={OrdersScreen} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Orders" component={OrdersScreen} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
    <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const { t } = useLanguage();
  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.backgroundSecondary },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{
        tabBarLabel: t('tabHome'),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? 'home' : 'home-outline'} size={size || 24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersStack}
      options={{
        tabBarLabel: t('myOrders'),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size || 24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Cart"
      component={CartScreen}
      options={{
        tabBarLabel: t('tabCart'),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size || 24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarLabel: t('tabProfile'),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? 'person' : 'person-outline'} size={size || 24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

export default TabNavigator;
