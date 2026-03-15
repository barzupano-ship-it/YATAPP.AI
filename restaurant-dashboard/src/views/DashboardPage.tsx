"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  UtensilsCrossed,
  MapPin,
  Clock,
  ArrowRight,
  Settings,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ordersService,
  Order,
} from "@/services/orders.service";
import { restaurantService, Restaurant } from "@/services/restaurant.service";
import { menuService, MenuCategory } from "@/services/menu.service";
import { useTranslation } from "@/i18n/context";
import { useRestaurantId } from "@/hooks/useRestaurant";

const ORDER_STATUS_KEYS: Record<string, string> = {
  received: "orders.received",
  pending: "orders.received",
  accepted: "orders.received",
  preparing: "orders.preparing",
  ready_for_pickup: "orders.readyForPickup",
  ready: "orders.readyForPickup",
  picked_up: "orders.readyForPickup",
  delivering: "orders.readyForPickup",
  completed: "orders.completed",
  delivered: "orders.completed",
};

export function DashboardPage() {
  const { t } = useTranslation();
  const restaurantId = useRestaurantId();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    const load = async () => {
      const [restaurantData, ordersData, menuData] = await Promise.all([
        restaurantService.getRestaurant(restaurantId),
        ordersService.getOrders(restaurantId),
        menuService.getMenu(restaurantId),
      ]);
      setRestaurant(restaurantData);
      setOrders(ordersData);
      setMenu(menuData);
      setLoading(false);
    };
    load();
  }, [restaurantId]);

  const todaysOrders = orders.filter((o) => {
    const dateStr = o.createdAt ?? o.created_at ?? "";
    if (!dateStr) return false;
    const orderDate = new Date(dateStr).toDateString();
    return orderDate === new Date().toDateString();
  });

  const totalMenuItems = menu.reduce((sum, cat) => sum + cat.items.length, 0);
  const availableItems = menu.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.available).length,
    0
  );

  const quickActions = [
    { href: "/dashboard/orders", labelKey: "dashboard.viewOrders", icon: ShoppingBag },
    { href: "/dashboard/menu", labelKey: "dashboard.manageMenu", icon: UtensilsCrossed },
    { href: "/dashboard/settings", labelKey: "nav.restaurantSettings", icon: Settings },
  ];

  if (loading) {
    return (
      <Header
        title={t("nav.dashboard")}
        subtitle={t("common.loading")}
      />
    );
  }

  if (!restaurantId || !restaurant) {
    return (
      <>
        <Header
          title={t("nav.dashboard")}
          subtitle={t("dashboard.setupSubtitle")}
        />
        <Card className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {t("dashboard.setupTitle")}
          </h2>
          <p className="text-slate-600 mb-6">
            {t("dashboard.setupDescription")}
          </p>
          <Link href="/dashboard/settings">
            <Button>{t("dashboard.createRestaurant")}</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header
        title={
          restaurant
            ? t("dashboard.welcomeBack", { name: restaurant.name })
            : t("nav.dashboard")
        }
        subtitle={t("dashboard.subtitle")}
      />

      {/* Restaurant Information */}
      {restaurant && (
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("dashboard.restaurantInfo")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium text-slate-900">{restaurant.name}</p>
              <p className="text-sm text-slate-600 mt-1">{restaurant.cuisine}</p>
              {restaurant.description && (
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {restaurant.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{restaurant.openingHours}</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 mt-4"
          >
            {t("dashboard.editRestaurantInfo")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">{t("dashboard.todaysOrders")}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {todaysOrders.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {todaysOrders.filter((o) => !["delivered", "completed"].includes(o.status)).length}{" "}
                {t("dashboard.needAttention")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">{t("dashboard.menuOverview")}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {menu.length} {t("dashboard.categories")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {availableItems}/{totalMenuItems} {t("dashboard.itemsAvailable")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">{t("dashboard.totalItems")}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalMenuItems}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t("dashboard.acrossCategories")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Orders */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("dashboard.todaysOrders")}
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              {t("dashboard.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {todaysOrders.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">
                {t("dashboard.noOrdersToday")}
              </p>
            ) : (
              todaysOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    <p className="text-sm text-slate-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      ${(typeof order.total === "number" ? order.total : parseFloat(String(order.total_price ?? order.total ?? 0))).toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        ["delivered", "completed"].includes(order.status)
                          ? "bg-emerald-100 text-emerald-700"
                          : ["ready", "ready_for_pickup", "picked_up", "delivering"].includes(order.status)
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "preparing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {t(ORDER_STATUS_KEYS[order.status] ?? order.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("dashboard.quickActions")}
          </h2>
          <div className="space-y-3">
            {quickActions.map(({ href, labelKey, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="outline"
                  fullWidth
                  className="justify-start gap-3 h-12"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {t(labelKey)}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
