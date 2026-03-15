import { api, getApiBase } from '../lib/api';
import { resolveImageUrl } from '../utils';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export async function getRestaurantMenu(restaurantId) {
  if (!USE_API) return [];
  const menu = await api.get(`/menu/restaurant/${restaurantId}`);
  if (!Array.isArray(menu)) return [];
  const base = getApiBase();
  return menu.map((cat) => ({
    id: String(cat.id),
    name: cat.name || '',
    items: (cat.items || []).map((i) => ({
      id: String(i.id),
      name: i.name || '',
      description: i.description || '',
      price: parseFloat(i.price) || 0,
      image: resolveImageUrl(i.image, base),
      category_id: i.category_id,
    })),
  }));
}

export async function getRestaurantMenuItem(restaurantId, itemId) {
  const categories = await getRestaurantMenu(restaurantId);
  for (const category of categories) {
    const item = (category.items || []).find((entry) => String(entry.id) === String(itemId));
    if (item) {
      return { ...item, category: category.name };
    }
  }
  return null;
}
