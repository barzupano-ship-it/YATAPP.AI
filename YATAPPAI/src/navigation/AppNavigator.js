import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
};

export default AppNavigator;
