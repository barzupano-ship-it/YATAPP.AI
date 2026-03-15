"use client";

import { useEffect, useMemo, useState } from "react";
import { Inbox, ChefHat, Package, CheckCircle, Trash2, Phone } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ordersService,
  Order,
  OrderStatus,
} from "@/services/orders.service";
import { useTranslation } from "@/i18n/context";
import { useRestaurantId } from "@/hooks/useRestaurant";

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; icon: typeof Inbox; color: string }
> = {
  received: {
    labelKey: "orders.received",
    icon: Inbox,
    color: "bg-amber-100 text-amber-700",
  },
  pending: {
    labelKey: "orders.received",
    icon: Inbox,
    color: "bg-amber-100 text-amber-700",
  },
  accepted: {
    labelKey: "orders.accepted",
    icon: Inbox,
    color: "bg-amber-100 text-amber-700",
  },
  preparing: {
    labelKey: "orders.preparing",
    icon: ChefHat,
    color: "bg-orange-100 text-orange-700",
  },
  ready: {
    labelKey: "orders.readyForPickup",
    icon: Package,
    color: "bg-blue-100 text-blue-700",
  },
  picked_up: {
    labelKey: "orders.pickedUp",
    icon: Package,
    color: "bg-blue-100 text-blue-700",
  },
  delivering: {
    labelKey: "orders.delivering",
    icon: Package,
    color: "bg-blue-100 text-blue-700",
  },
  delivered: {
    labelKey: "orders.delivered",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700",
  },
  ready_for_pickup: {
    labelKey: "orders.readyForPickup",
    icon: Package,
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    labelKey: "orders.completed",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700",
  },
  cancelled: {
    labelKey: "orders.cancelled",
    icon: CheckCircle,
    color: "bg-slate-100 text-slate-600",
  },
};

const NEXT_RESTAURANT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
  picked_up: "delivering",
  delivering: "delivered",
};

export function OrdersPage() {
  const { t } = useTranslation();
  const restaurantId = useRestaurantId();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchOrders = async () => {
      if (!restaurantId) {
        if (active) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await ordersService.getOrders(restaurantId);
        if (active) {
          setOrders(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : t("orders.loadFailed"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchOrders();

    if (!restaurantId) {
      return () => {
        active = false;
      };
    }

    const intervalId = window.setInterval(() => {
      void ordersService.getOrders(restaurantId).then((data) => {
        if (active) {
          setOrders(data);
        }
      });
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [restaurantId, t]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!restaurantId) return;

    setBusyOrderId(orderId);
    setError("");

    try {
      const updated = await ordersService.updateOrderStatus(
        restaurantId,
        orderId,
        newStatus
      );
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.actionFailed"));
    } finally {
      setBusyOrderId(null);
    }
  };

  const getAvailableStatuses = (current: OrderStatus): OrderStatus[] => {
    const nextStatus = NEXT_RESTAURANT_STATUS[current];
    return nextStatus ? [nextStatus] : [];
  };

  const hideOrder = async (orderId: string) => {
    const confirmed = window.confirm(t("orders.deleteConfirm"));
    if (!confirmed || !restaurantId) return;

    setBusyOrderId(orderId);
    setError("");

    try {
      await ordersService.deleteOrder(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.actionFailed"));
    } finally {
      setBusyOrderId(null);
    }
  };

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status !== "cancelled"),
    [orders]
  );

  if (loading) {
    return <Header title={t("orders.title")} subtitle={t("common.loading")} />;
  }

  return (
    <>
      <Header title={t("orders.title")} subtitle={t("orders.subtitle")} />

      {error && (
        <Card className="mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {visibleOrders.length === 0 ? (
          <Card className="py-16 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">{t("orders.noOrders")}</p>
            <p className="text-slate-500 text-sm mt-1">
              {t("orders.noOrdersSubtitle")}
            </p>
          </Card>
        ) : (
          visibleOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const Icon = config.icon;
            const availableStatuses = getAvailableStatuses(order.status);

            return (
              <Card key={order.id}>
                <div className="flex flex-col gap-6 justify-between lg:flex-row lg:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900 text-lg">
                        {t("orders.order")} {order.orderNumber}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(config.labelKey)}
                      </span>
                    </div>

                    <p className="text-slate-600 font-medium">
                      {order.customerName || `Customer #${order.customer_id}`}
                    </p>

                    {(order.customerPhone ?? order.customer_phone) && (
                      <a
                        href={`tel:${(order.customerPhone ?? order.customer_phone ?? "").replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 mt-1"
                        title={t("orders.customerPhone")}
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{order.customerPhone ?? order.customer_phone}</span>
                      </a>
                    )}

                    {order.deliveryAddress && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {order.deliveryAddress}
                      </p>
                    )}

                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(order.createdAt ?? order.created_at ?? "").toLocaleString()}
                    </p>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {t("orders.orderedItems")}
                      </p>
                      <ul className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <li
                            key={item.id || idx}
                            className="flex justify-between text-sm text-slate-600"
                          >
                            <span>
                              {item.quantity}x {item.menu_item_name || item.name || "Item"}
                            </span>
                            <span>
                              {(parseFloat(String(item.price)) * item.quantity).toFixed(0)} с.
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(order.receiptScreenUrl ?? order.receipt_screen_url) && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          {t("orders.receiptPhoto")}
                        </p>
                        <a
                          href={order.receiptScreenUrl ?? order.receipt_screen_url ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-slate-200 overflow-hidden bg-slate-100 hover:border-orange-300 transition-colors max-w-[200px]"
                        >
                          <img
                            src={order.receiptScreenUrl ?? order.receipt_screen_url ?? ""}
                            alt={t("orders.receiptPhoto")}
                            className="w-full aspect-video object-cover"
                          />
                          <span className="block py-2 text-center text-xs font-medium text-slate-600">
                            {t("orders.receiptClickToView")}
                          </span>
                        </a>
                      </div>
                    )}

                  </div>

                  <div className="flex flex-col items-end gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        {(order.subtotal ?? order.total ?? parseFloat(String(order.total_price)) ?? 0).toFixed(0)} с.
                      </p>
                      <p className="text-sm text-slate-500">{t("orders.total")}</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      {!["delivered", "cancelled"].includes(order.status) &&
                        availableStatuses.length > 0 &&
                        availableStatuses.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            disabled={busyOrderId === order.id}
                            onClick={() => updateStatus(order.id, status)}
                          >
                            {t("orders.markAs")} {t(STATUS_CONFIG[status].labelKey)}
                          </Button>
                        ))}

                      <Button
                          size="sm"
                          variant="danger"
                          disabled={busyOrderId === order.id}
                          onClick={() => hideOrder(order.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("orders.deleteOrder")}
                        </Button>
                    </div>
                  </div>
                </div>

              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
