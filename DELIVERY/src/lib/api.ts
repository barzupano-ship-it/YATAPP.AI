import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';
const TOKEN_KEY = 'delivery_auth_token';

let token: string | null = null;

export async function loadToken(): Promise<string | null> {
  try {
    token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
}

export function setToken(t: string | null) {
  token = t;
  if (t) AsyncStorage.setItem(TOKEN_KEY, t).catch(() => {});
  else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

export function getToken() {
  return token;
}

export function getApiBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL || '';
  return url.replace(/\/api\/?$/, '') || 'http://localhost:3000';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env to connect to the backend.');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
