import { api, getApiBase } from '../lib/api';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function resolveImageUrl(url, base) {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) return trimmed;
  return base ? `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` : trimmed;
}

export async function getRestaurants(city) {
  if (!USE_API) return [];
  const url = city ? `/restaurants?city=${encodeURIComponent(city)}` : '/restaurants';
  const data = await api.get(url);
  const list = Array.isArray(data) ? data : [];
  const base = getApiBase();
  return list.map((r) => ({
    id: String(r.id),
    name: r.name || '',
    image: resolveImageUrl(r.logo || r.cover_image, base),
    cuisine: r.cuisine || '',
    deliveryTime: r.delivery_time ?? r.deliveryTime ?? 30,
    address: r.address,
    city: r.city,
  }));
}

export async function getRestaurantById(restaurantId) {
  if (!USE_API) return null;
  const data = await api.get(`/restaurants/${restaurantId}`);
  return data;
}

export function buildPaymentMethodsFromRestaurant(restaurant) {
  const methods = [];
  const alifDetail =
    restaurant?.alif_bank_wallet_number ||
    restaurant?.alifBankWalletNumber ||
    restaurant?.alif_bank_card_number ||
    restaurant?.alifBankCardNumber ||
    null;
  methods.push({
    id: 'alif',
    labelKey: 'paymentAlif',
    detail: alifDetail,
  });
  const dcDetail =
    restaurant?.dc_bank_wallet_number ||
    restaurant?.dcBankWalletNumber ||
    restaurant?.dc_bank_card_number ||
    restaurant?.dcBankCardNumber ||
    null;
  methods.push({
    id: 'dc',
    labelKey: 'paymentDc',
    detail: dcDetail,
  });
  return methods;
}
