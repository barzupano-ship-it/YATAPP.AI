import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken, loadToken } from '../lib/api';
import { registerPushTokenWithBackend } from './notificationService';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;
const DEMO_USER_KEY = 'demo_user';

function toUser(user) {
  if (!user || user.id == null) {
    throw new Error('Invalid response from server');
  }
  return {
    id: String(user.id),
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    role: typeof user.role === 'string' ? user.role.toLowerCase() : undefined,
  };
}

function extractUserAndToken(res) {
  const data = res.data ?? res;
  const user = data.user ?? data;
  const token = data.token ?? res.token;
  return { user, token };
}

function isNetworkOrServerError(err) {
  const msg = err?.message || '';
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('Network') ||
    msg.includes('connect') ||
    msg.includes('Invalid response')
  );
}

async function getDemoUser() {
  try {
    const json = await AsyncStorage.getItem(DEMO_USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

async function setDemoUser(user) {
  try {
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  } catch {}
}

export async function login(email, password) {
  if (!USE_API) {
    const user = { id: 'demo-' + Date.now(), name: 'User', email, phone: '' };
    await setDemoUser(user);
    return user;
  }
  try {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = extractUserAndToken(res);
    setToken(token);
    registerPushTokenWithBackend();
    return toUser(user);
  } catch (err) {
    if (isNetworkOrServerError(err)) {
      const demo = await getDemoUser();
      if (demo && demo.email === email) return demo;
      throw new Error('Could not connect to the server. Register first to use offline mode.');
    }
    throw err;
  }
}

export async function register(data) {
  if (!USE_API) {
    const user = {
      id: 'demo-' + Date.now(),
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
    };
    await setDemoUser(user);
    return user;
  }
  try {
    const res = await api.post('/auth/register', {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
      role: 'customer',
    });
    const { user, token } = extractUserAndToken(res);
    setToken(token);
    registerPushTokenWithBackend();
    return toUser(user);
  } catch (err) {
    if (isNetworkOrServerError(err)) {
      const user = {
        id: 'demo-' + Date.now(),
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
      };
      await setDemoUser(user);
      return user;
    }
    throw err;
  }
}

export async function getCurrentUser() {
  if (!USE_API) return getDemoUser();
  const t = await loadToken();
  if (!t) {
    return null;
  }
  try {
    const res = await api.get('/auth/me');
    const user = res?.data ?? res?.user ?? res;
    const normalized = toUser(user);
    if (normalized.role && !['customer', 'admin'].includes(normalized.role)) {
      setToken(null);
      return null;
    }
    return normalized;
  } catch {
    // Token is missing/expired/invalid, so treat the user as signed out in API mode.
    setToken(null);
    return null;
  }
}

export async function logout() {
  setToken(null);
  try {
    await AsyncStorage.removeItem(DEMO_USER_KEY);
  } catch {}
}
