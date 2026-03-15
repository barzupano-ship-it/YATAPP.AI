import { api, setToken, loadToken } from '../lib/api';
import { registerPushTokenWithBackend } from './notificationService';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
};

function isAllowedDeliveryRole(role: string | undefined): boolean {
  return role === 'courier' || role === 'admin';
}

function mapApiUser(user: ApiUser): User {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

export async function login(email: string, password: string): Promise<User | null> {
  if (!USE_API) return null;
  const { user, token } = await api.post<{ user: ApiUser; token: string }>(
    '/auth/login',
    { email, password }
  );
  if (!isAllowedDeliveryRole(user.role)) {
    setToken(null);
    throw new Error('Sign in with a courier account');
  }
  setToken(token);
  registerPushTokenWithBackend();
  return mapApiUser(user);
}

export async function getCurrentUser(): Promise<User | null> {
  if (!USE_API) return null;
  const t = await loadToken();
  if (!t) return null;
  try {
    const user = await api.get<ApiUser>('/auth/me');
    if (!isAllowedDeliveryRole(user.role)) {
      setToken(null);
      return null;
    }
    return mapApiUser(user);
  } catch {
    setToken(null);
    return null;
  }
}

export function logout(): void {
  setToken(null);
}
