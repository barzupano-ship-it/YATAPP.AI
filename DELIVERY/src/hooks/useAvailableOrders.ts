import { useState, useEffect, useCallback } from 'react';
import { getAvailableOrders } from '../services/orderService';
import { MOCK_ORDERS } from '../services/mockData';
import { useAuth, useCity } from '../context';
import type { Order } from '../context';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;
const REFRESH_INTERVAL_MS = 5000;

function isUnauthorizedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('Unauthorized') || message.includes('401');
}

export function useAvailableOrders() {
  const { isAuthenticated, isInitializing, logout } = useAuth();
  const { city } = useCity();
  const [orders, setOrders] = useState<Order[]>(USE_API ? [] : MOCK_ORDERS);
  const [loading, setLoading] = useState(USE_API);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!USE_API || !isAuthenticated || isInitializing) return;
    setLoading(true);
    setError(null);
    getAvailableOrders(city)
      .then(setOrders)
      .catch((e) => {
        if (isUnauthorizedError(e)) {
          setOrders([]);
          logout();
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing, logout, city]);

  useEffect(() => {
    if (!USE_API) return;
    if (!isAuthenticated || isInitializing) {
      setOrders([]);
      setError(null);
      setLoading(false);
      return;
    }
    refresh();
    const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isInitializing, refresh]);

  return { orders, loading, error, refresh };
}
