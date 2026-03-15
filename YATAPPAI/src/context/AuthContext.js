import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as authService from '../services/authService';
import { registerPushTokenWithBackend } from '../services/notificationService';

const AuthContext = createContext(null);
const CUSTOMER_APP_ROLES = new Set(['customer', 'admin']);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          setUser(u);
          registerPushTokenWithBackend();
        }
      } catch {
        // Not logged in or API not configured
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const login = async (userData) => {
    if (typeof userData === 'object' && userData.email && userData.password) {
      const u = await authService.login(userData.email, userData.password);
      if (u) {
        if (u.role && !CUSTOMER_APP_ROLES.has(u.role)) {
          authService.logout();
          throw new Error('This account cannot place customer orders. Please sign in with a customer account.');
        }
        setUser(u);
        registerPushTokenWithBackend();
        return u;
      }
      throw new Error('Invalid credentials');
    }
    setUser({
      id: '1',
      name: 'Cameron Cook',
      email: userData.email || 'darrell_bailey@gmail.com',
      phone: '+65 39879 343',
      ...userData,
    });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updates) =>
    setUser((prev) => (prev ? { ...prev, ...updates } : null));

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitializing,
      login,
      logout,
      updateUser,
    }),
    [user, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
