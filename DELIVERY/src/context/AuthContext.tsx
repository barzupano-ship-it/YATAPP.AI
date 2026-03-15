import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authService from '../services/authService';
import { registerPushTokenWithBackend } from '../services/notificationService';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  codeSent: boolean;
  useApiAuth: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  requestCode: (contact: string) => Promise<void>;
  verifyCode: (code: string, contact: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  resetCodeRequest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [pendingContact, setPendingContact] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      if (USE_API) {
        try {
          const u = await Promise.race([
            authService.getCurrentUser(),
            new Promise<null>((r) => setTimeout(() => r(null), 5000)),
          ]);
          if (u) {
            setUser(u);
            registerPushTokenWithBackend();
          }
        } catch {
          // Not logged in or network error
        }
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
      setIsInitializing(false);
    };
    checkAuth();
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    if (!USE_API) return;
    setIsLoading(true);
    try {
      const u = await authService.login(email, password);
      if (u) setUser(u);
      else throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestCode = useCallback(async (contact: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setPendingContact(contact);
      setCodeSent(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async (code: string, contact: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        throw new Error('Invalid code');
      }
      // In production: verify code with backend. For demo, accept any non-empty code.
      setUser({
        id: '1',
        email: contact.includes('@') ? contact : '',
        name: contact.split('@')[0] || contact,
        phone: contact.includes('@') ? undefined : contact,
      });
      setCodeSent(false);
      setPendingContact('');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
    // In production: sync to backend
  }, []);

  const resetCodeRequest = useCallback(() => {
    setCodeSent(false);
    setPendingContact('');
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setCodeSent(false);
    setPendingContact('');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        isAuthenticated: !!user,
        codeSent,
        useApiAuth: USE_API,
        loginWithPassword,
        requestCode,
        verifyCode,
        updateUser,
        resetCodeRequest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
