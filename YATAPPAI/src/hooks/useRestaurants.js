import { useState, useEffect } from 'react';
import { getRestaurants } from '../services/restaurantService';
import { RESTAURANTS } from '../data';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export function useRestaurants(city) {
  const [restaurants, setRestaurants] = useState(USE_API ? [] : RESTAURANTS);
  const [loading, setLoading] = useState(USE_API);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!USE_API) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRestaurants(city)
      .then((list) => {
        if (!cancelled) setRestaurants(list);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e?.message || '';
        const isConnectionError = msg.includes('connect') || msg.includes('fetch') || msg.includes('network');
        if (isConnectionError) {
          setRestaurants(RESTAURANTS);
          setError(null);
        } else {
          setError(msg || 'Failed to load');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [city]);

  return { restaurants, loading, error };
}
