import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';
const TOKEN_KEY = 'auth_token';

let token = null;

export async function loadToken() {
  try {
    token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
}

export function setToken(t) {
  token = t;
  if (t) AsyncStorage.setItem(TOKEN_KEY, t).catch(() => {});
  else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

export function getToken() {
  return token;
}

export function getApiBase() {
  const url = process.env.EXPO_PUBLIC_API_URL || '';
  return url.replace(/\/api\/?$/, '') || 'http://localhost:3002';
}

async function request(path, options = {}) {
  if (!API_BASE) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env to connect to the backend.');
  }
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('Network')) {
      throw new Error('Could not connect to the server. Please check your connection and that the API is running.');
    }
    throw err;
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = data.error;
    const msg = typeof err === 'string' ? err : (err?.message ?? err?.msg ?? null);
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
