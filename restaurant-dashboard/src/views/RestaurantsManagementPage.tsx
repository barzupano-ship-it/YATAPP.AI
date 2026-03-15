"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/context";
import { authService } from "@/services/auth.service";
import { Restaurant, restaurantService } from "@/services/restaurant.service";
import { useRestaurantId } from "@/hooks/useRestaurant";

export function RestaurantsManagementPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const activeRestaurantId = useRestaurantId();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await restaurantService.getOwnedRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("restaurants.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  const sortedRestaurants = useMemo(
    () =>
      [...restaurants].sort((a, b) =>
        a.id === activeRestaurantId ? -1 : b.id === activeRestaurantId ? 1 : 0
      ),
    [activeRestaurantId, restaurants]
  );

  const handleManage = (restaurant: Restaurant) => {
    const user = authService.getStoredUser();
    if (user) {
      authService.setStoredUser({
        ...user,
        restaurantId: restaurant.id,
      });
    }
    router.push("/dashboard/settings");
  };

  const handleDelete = async (restaurant: Restaurant) => {
    const confirmed = window.confirm(
      t("restaurants.deleteConfirm", { name: restaurant.name })
    );
    if (!confirmed) return;

    setDeletingId(restaurant.id);
    setError("");
    setSuccess("");

    try {
      await restaurantService.deleteRestaurant(restaurant.id);

      const nextRestaurants = restaurants.filter((item) => item.id !== restaurant.id);
      setRestaurants(nextRestaurants);

      const user = authService.getStoredUser();
      if (user && user.restaurantId === restaurant.id) {
        authService.setStoredUser({
          ...user,
          restaurantId: nextRestaurants[0]?.id,
        });
      }

      setSuccess(t("restaurants.deleteSuccess", { name: restaurant.name }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("restaurants.deleteFailed")
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Header
        title={t("restaurants.title")}
        subtitle={t("common.loading")}
      />
    );
  }

  return (
    <>
      <Header
        title={t("restaurants.title")}
        subtitle={t("restaurants.subtitle")}
      />

      {(error || success) && (
        <Card className="mb-6">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : (
            <p className="text-sm text-emerald-700">{success}</p>
          )}
        </Card>
      )}

      {sortedRestaurants.length === 0 ? (
        <Card className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {t("restaurants.emptyTitle")}
          </h2>
          <p className="text-slate-600 mb-6">{t("restaurants.emptyDescription")}</p>
          <Button onClick={() => router.push("/dashboard/settings")}>
            {t("restaurants.createRestaurant")}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedRestaurants.map((restaurant) => {
            const isActive = restaurant.id === activeRestaurantId;

            return (
              <Card key={restaurant.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-slate-900 truncate">
                          {restaurant.name}
                        </h2>
                        {isActive && (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            {t("restaurants.active")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 mt-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="text-sm">{restaurant.address}</span>
                      </div>
                      {restaurant.description && (
                        <p className="text-sm text-slate-500 mt-3 line-clamp-3">
                          {restaurant.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant={isActive ? "primary" : "outline"}
                    onClick={() => handleManage(restaurant)}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {isActive
                      ? t("restaurants.editCurrent")
                      : t("restaurants.manage")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(restaurant)}
                    disabled={deletingId === restaurant.id}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingId === restaurant.id
                      ? t("restaurants.deleting")
                      : t("restaurants.delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
