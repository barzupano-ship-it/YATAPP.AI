import { useState, useEffect } from 'react';
import { getRestaurantById } from '../services/restaurantService';
import { getRestaurantMenu } from '../services/menuService';
import { RESTAURANTS, FOOD_CATEGORIES } from '../data';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export function useRestaurantMenu(restaurantId) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!restaurantId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      setCategories([]);
      setLoading(false);
      return;
    }
    if (!USE_API) {
      const r = RESTAURANTS.find((x) => x.id === restaurantId);
      const cats = FOOD_CATEGORIES[restaurantId] || [];
      setRestaurant(r || null);
      setCategories(cats);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getRestaurantById(restaurantId),
      getRestaurantMenu(restaurantId),
    ])
      .then(([r, cats]) => {
        if (cancelled) return;
        setRestaurant(r || null);
        setCategories(cats || []);
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e?.message || '';
          const isConnectionError = msg.includes('connect') || msg.includes('fetch') || msg.includes('network');
          if (isConnectionError) {
            const r = RESTAURANTS.find((x) => x.id === restaurantId);
            const cats = FOOD_CATEGORIES[restaurantId] || [];
            setRestaurant(r || null);
            setCategories(cats);
            setError(null);
          } else {
            setError(msg || 'Failed to load');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [restaurantId]);

  const menu = categories.flatMap((cat) =>
    (cat.items || []).map((i) => ({ ...i, category: cat.name }))
  );

  return { restaurant, categories, menu, loading, error };
}
