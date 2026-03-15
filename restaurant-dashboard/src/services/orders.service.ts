const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

export type OrderStatus =
  | "received"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "pending"
  | "accepted"
  | "ready"
  | "picked_up"
  | "delivering"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  menu_item_id?: number;
  menu_item_name?: string;
  name?: string;
  quantity: number;
  price: string | number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customer_id?: number;
  customerName?: string;
  customerPhone?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal?: number;
  total_price?: string | number;
  total?: number;
  status: OrderStatus;
  created_at?: string;
  createdAt?: string;
  delivery_address?: string;
  deliveryAddress?: string;
  receipt_screen_url?: string;
  receiptScreenUrl?: string;
}

let MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "#1001",
    customerName: "John Smith",
    customerPhone: "+1 555-123-4567",
    items: [
      { id: "oi-1", name: "Margherita Pizza", quantity: 1, price: 14.99 },
      { id: "oi-2", name: "Fresh Lemonade", quantity: 2, price: 4.99 },
    ],
    total: 24.97,
    status: "preparing",
    createdAt: new Date().toISOString(),
    deliveryAddress: "456 Oak Ave, Apt 2B",
    receiptScreenUrl: "https://placehold.co/400x300/e2e8f0/64748b?text=Receipt",
  },
  {
    id: "ord-2",
    orderNumber: "#1002",
    customerName: "Sarah Johnson",
    customerPhone: "+1 555-234-5678",
    items: [
      { id: "oi-3", name: "Classic Burger", quantity: 1, price: 12.99 },
      { id: "oi-4", name: "Tiramisu", quantity: 1, price: 8.99 },
    ],
    total: 21.98,
    status: "accepted",
    createdAt: new Date().toISOString(),
    deliveryAddress: "789 Pine St",
  },
  {
    id: "ord-3",
    orderNumber: "#1003",
    customerName: "Mike Davis",
    customerPhone: "+1 555-345-6789",
    items: [{ id: "oi-5", name: "Margherita Pizza", quantity: 2, price: 14.99 }],
    total: 29.98,
    status: "ready",
    createdAt: new Date().toISOString(),
    deliveryAddress: "321 Elm Rd",
  },
];

export const ordersService = {
  async getOrders(restaurantId: string): Promise<Order[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return [...MOCK_ORDERS];
    }
    const { api } = await import("@/lib/api");
    const data = await api.get<
      Record<string, unknown>[] | { data?: unknown[] }
    >(`/orders/restaurant?restaurant_id=${restaurantId}`);
    const arr = Array.isArray(data)
      ? data
      : (data as { data?: unknown[] })?.data;
    return (Array.isArray(arr) ? arr : []).map((o) => {
      const r = o as Record<string, unknown>;
      const status = (r.status as string) || "pending";
      const items = (r.items as OrderItem[]) || [];
      const subtotal = parseFloat(String(r.subtotal ?? 0)) || items.reduce((sum, i) => sum + parseFloat(String(i.price || 0)) * (i.quantity || 1), 0);
      const totalPrice = parseFloat(String(r.total_price ?? 0)) || subtotal + parseFloat(String(r.delivery_fee ?? 12));
      return {
        id: String(r.id),
        orderNumber: `#${r.id}`,
        customerName: (r.customer_name as string) || "",
        customerPhone: (r.customer_phone as string) || (r.customerPhone as string) || "",
        customer_id: r.customer_id as number,
        items,
        subtotal,
        total: totalPrice,
        total_price: totalPrice,
        status: status as OrderStatus,
        createdAt: (r.created_at as string) || "",
        deliveryAddress: (r.delivery_address as string) || "",
        receiptScreenUrl: (r.receipt_screen_url as string) || (r.receiptScreenUrl as string) || "",
      };
    });
  },

  async updateOrderReceipt(
    orderId: string,
    receiptScreenUrl: string
  ): Promise<Order> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const order = MOCK_ORDERS.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");
      const updated = { ...order, receiptScreenUrl };
      MOCK_ORDERS = MOCK_ORDERS.map((o) => (o.id === orderId ? updated : o));
      return updated;
    }
    const { api } = await import("@/lib/api");
    const data = await api.put<Record<string, unknown>>(
      `/orders/${orderId}/receipt`,
      { receipt_screen_url: receiptScreenUrl }
    );
    return {
      id: String(data.id),
      orderNumber: `#${data.id}`,
      customerName: data.customer_name as string,
      items: (data.items as OrderItem[]) || [],
      total: parseFloat(String(data.total_price || 0)),
      status: (data.status as OrderStatus) || "pending",
      createdAt: (data.created_at as string) || "",
      deliveryAddress: (data.delivery_address as string) || "",
      receiptScreenUrl: (data.receipt_screen_url as string) || "",
    };
  },

  async updateOrderStatus(
    _restaurantId: string,
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const order = MOCK_ORDERS.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");
      const updated = { ...order, status };
      MOCK_ORDERS = MOCK_ORDERS.map((o) => (o.id === orderId ? updated : o));
      return updated;
    }
    const { api } = await import("@/lib/api");
    const data = await api.put<Record<string, unknown>>(
      `/orders/${orderId}/status`,
      { status }
    );
    const items = (data.items as OrderItem[]) || [];
    const subtotal = parseFloat(String(data.subtotal ?? 0)) || items.reduce((sum, i) => sum + parseFloat(String(i.price || 0)) * (i.quantity || 1), 0);
    const totalPrice = parseFloat(String(data.total_price ?? 0)) || subtotal + parseFloat(String(data.delivery_fee ?? 12));
    return {
      id: String(data.id),
      orderNumber: `#${data.id}`,
      customerName: (data.customer_name as string) || "",
      customerPhone: (data.customer_phone as string) || "",
      customer_id: data.customer_id as number,
      items,
      subtotal,
      total: totalPrice,
      total_price: totalPrice,
      status: (data.status as OrderStatus) || "pending",
      createdAt: (data.created_at as string) || "",
      deliveryAddress: (data.delivery_address as string) || "",
      receiptScreenUrl: (data.receipt_screen_url as string) || "",
    };
  },

  async deleteOrder(orderId: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      MOCK_ORDERS = MOCK_ORDERS.filter((order) => order.id !== orderId);
      return;
    }

    await this.updateOrderStatus("", orderId, "cancelled");
  },
};
