import { api, getToken } from '../lib/api';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function normalizeOrder(order) {
  if (!order) return null;
  return {
    ...order,
    id: String(order.id),
    status: String(order.status || 'pending'),
    courier_id: order.courier_id != null ? String(order.courier_id) : null,
    courier_name: order.courier_name || null,
    courier_phone: order.courier_phone || null,
    courier_latitude: order.courier_latitude != null ? Number(order.courier_latitude) : null,
    courier_longitude: order.courier_longitude != null ? Number(order.courier_longitude) : null,
    items: Array.isArray(order.items) ? order.items : [],
  };
}

export async function createOrder(restaurantId, deliveryAddress, items, deliveryCoords = null, googleMapsUrl = null) {
  if (!USE_API) throw new Error('API not configured');
  if (!getToken()) {
    throw new Error('Your session expired. Please log in again before placing an order.');
  }
  const payload = {
    restaurant_id: parseInt(restaurantId, 10),
    delivery_address: deliveryAddress,
    items: items.map((i) => ({ menu_item_id: parseInt(i.menu_item_id || i.id, 10), quantity: i.quantity || 1 })),
  };
  if (deliveryCoords?.latitude != null && deliveryCoords?.longitude != null) {
    payload.delivery_latitude = deliveryCoords.latitude;
    payload.delivery_longitude = deliveryCoords.longitude;
  }
  if (googleMapsUrl) {
    payload.delivery_google_maps_url = googleMapsUrl;
  }
  const order = await api.post('/orders', payload);
  return normalizeOrder(order);
}

export async function getMyOrders() {
  if (!USE_API) return [];
  const list = await api.get('/orders/customer');
  return (Array.isArray(list) ? list : []).map(normalizeOrder).filter(Boolean);
}

export async function getOrderById(id) {
  if (!USE_API) return null;
  const order = await api.get(`/orders/${id}`);
  return normalizeOrder(order);
}

export async function cancelOrder(orderId) {
  if (!USE_API) return null;
  if (!getToken()) throw new Error('Your session expired. Please log in again.');
  const data = await api.post(`/orders/${orderId}/cancel`);
  return normalizeOrder(data);
}

export async function updateOrderReceipt(orderId, receiptScreenUrl) {
  if (!USE_API) throw new Error('API not configured');
  if (!getToken()) throw new Error('Your session expired. Please log in again.');
  const data = await api.put(`/orders/${orderId}/receipt`, {
    receipt_screen_url: receiptScreenUrl,
  });
  return normalizeOrder(data);
}
