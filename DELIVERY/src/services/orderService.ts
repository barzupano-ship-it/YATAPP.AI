import { api } from '../lib/api';
import type { Order } from '../context';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function mapApiOrderToApp(o: Record<string, unknown>, deliveryFeeOverride?: number): Order {
  const items = (o.items as { menu_item_name?: string; quantity?: number }[]) || [];
  const itemsStr = items.map((i) => `${i.quantity || 1}x ${i.menu_item_name || 'Item'}`).join(', ');
  const fee = deliveryFeeOverride ?? (o.delivery_fee != null ? Number(o.delivery_fee) : null);
  return {
    id: String(o.id),
    restaurantId: o.restaurant_id != null ? String(o.restaurant_id) : undefined,
    restaurant: (o.restaurant_name as string) || `Restaurant #${o.restaurant_id ?? '?'}`,
    pickupAddress: (o.pickup_address as string) || 'Pickup at restaurant',
    deliveryAddress: (o.delivery_address as string) || '',
    status: typeof o.status === 'string' ? o.status : 'pending',
    distance: '—',
    deliveryFee: fee != null ? `${fee.toFixed(0)} с.` : '—',
    items: itemsStr,
    estimatedTime: '—',
    pickupLatitude: typeof o.pickup_latitude === 'number' ? o.pickup_latitude : undefined,
    pickupLongitude: typeof o.pickup_longitude === 'number' ? o.pickup_longitude : undefined,
    deliveryLatitude: typeof o.delivery_latitude === 'number' ? o.delivery_latitude : undefined,
    deliveryLongitude: typeof o.delivery_longitude === 'number' ? o.delivery_longitude : undefined,
    deliveryGoogleMapsUrl: typeof o.delivery_google_maps_url === 'string' ? o.delivery_google_maps_url : undefined,
  };
}

export async function getCourierOrders(options?: { includeHidden?: boolean }): Promise<Record<string, unknown>[]> {
  if (!USE_API) return [];
  const q = options?.includeHidden ? "?includeHidden=true" : "";
  const list = await api.get<Record<string, unknown>[]>(`/orders/courier${q}`);
  return Array.isArray(list) ? list : [];
}

export async function getCourierDeliveryFee(): Promise<number | null> {
  if (!USE_API) return null;
  try {
    const data = await api.get<{ delivery_fee: number }>('/couriers/me/delivery-fee');
    return data?.delivery_fee ?? null;
  } catch {
    return null;
  }
}

export async function getAvailableOrders(city?: string): Promise<Order[]> {
  if (!USE_API) return [];
  const path = city ? `/orders/available?city=${encodeURIComponent(city)}` : '/orders/available';
  const [list, courierFee] = await Promise.all([
    api.get<Record<string, unknown>[]>(path),
    getCourierDeliveryFee(),
  ]);
  const feeOverride = courierFee ?? undefined;
  return (Array.isArray(list) ? list : []).map((o) => mapApiOrderToApp(o, feeOverride));
}

export async function acceptOrder(orderId: string): Promise<Order | null> {
  if (!USE_API) return null;
  const o = await api.post<Record<string, unknown>>(`/orders/${orderId}/accept`);
  return mapApiOrderToApp(o);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  if (!USE_API) return;
  await api.put(`/orders/${orderId}/status`, { status });
}

export async function updateCourierLocation(orderId: string, latitude: number, longitude: number): Promise<void> {
  if (!USE_API) return;
  await api.put(`/orders/${orderId}/courier-location`, { latitude, longitude });
}

export async function hideOrderFromArchive(orderId: string): Promise<void> {
  if (!USE_API) return;
  await api.put(`/orders/${orderId}/hide-from-archive`, {});
}
