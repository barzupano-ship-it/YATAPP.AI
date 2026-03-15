"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Trash2, Users, Store, UserPlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  authService,
  User,
  userHasAdminAccess,
} from "@/services/auth.service";
import {
  AdminRestaurant,
  AdminUser,
  CreateCourierInput,
  PendingCourier,
  adminService,
} from "@/services/admin.service";
import { useTranslation } from "@/i18n/context";

const EMPTY_COURIER_FORM: CreateCourierInput = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

type AdminTab = "accounts" | "couriers" | "restaurants";

export function AdminPanelPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [pendingCouriers, setPendingCouriers] = useState<PendingCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [courierForm, setCourierForm] = useState(EMPTY_COURIER_FORM);
  const [activeTab, setActiveTab] = useState<AdminTab>("accounts");

  const loadAdminData = useCallback(async () => {
    const [usersData, restaurantsData, pendingData] = await Promise.all([
      adminService.getUsers(),
      adminService.getRestaurants(),
      adminService.getPendingCouriers(),
    ]);
    setUsers(usersData);
    setRestaurants(restaurantsData);
    setPendingCouriers(pendingData);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setError("");

      const user = await authService.refreshStoredUser();
      if (!isMounted) return;

      setCurrentUser(user);

      if (!userHasAdminAccess(user)) {
        router.replace("/dashboard");
        return;
      }

      try {
        await loadAdminData();
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : t("admin.loadFailed"));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [loadAdminData, router, t]);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.isSuperadmin === b.isSuperadmin ? 0 : a.isSuperadmin ? -1 : 1
      ),
    [users]
  );

  const nonCourierUsers = useMemo(
    () => sortedUsers.filter((user) => user.role !== "courier"),
    [sortedUsers]
  );

  const couriers = useMemo(
    () => sortedUsers.filter((user) => user.role === "courier"),
    [sortedUsers]
  );

  const handleModeratorToggle = async (user: AdminUser) => {
    if (!currentUser?.isSuperadmin) return;

    setBusyKey(`moderator:${user.id}`);
    setError("");
    setSuccess("");

    try {
      const updated = await adminService.setModerator(user.id, !user.isModerator);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
      setSuccess(
        updated.isModerator
          ? t("admin.moderatorGranted", { name: updated.name })
          : t("admin.moderatorRevoked", { name: updated.name })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setBusyKey(null);
    }
  };

  const handleUserDelete = async (user: AdminUser) => {
    const confirmed = window.confirm(
      t("admin.deleteUserConfirm", { name: user.name, email: user.email })
    );
    if (!confirmed) return;

    setBusyKey(`user:${user.id}`);
    setError("");
    setSuccess("");

    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setRestaurants((prev) => prev.filter((item) => item.owner.id !== user.id));
      setSuccess(t("admin.userDeleted", { name: user.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setBusyKey(null);
    }
  };

  const handleRestaurantDelete = async (restaurant: AdminRestaurant) => {
    const confirmed = window.confirm(
      t("admin.deleteRestaurantConfirm", { name: restaurant.name })
    );
    if (!confirmed) return;

    setBusyKey(`restaurant:${restaurant.id}`);
    setError("");
    setSuccess("");

    try {
      await adminService.deleteRestaurant(restaurant.id);
      setRestaurants((prev) => prev.filter((item) => item.id !== restaurant.id));
      setUsers((prev) =>
        prev.map((item) =>
          item.id === restaurant.owner.id
            ? {
                ...item,
                restaurantCount: Math.max(0, item.restaurantCount - 1),
              }
            : item
        )
      );
      setSuccess(t("admin.restaurantDeleted", { name: restaurant.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateCourier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser?.isSuperadmin) return;

    setBusyKey("courier:create");
    setError("");
    setSuccess("");

    try {
      const courier = await adminService.createCourier({
        name: courierForm.name.trim(),
        email: courierForm.email.trim(),
        phone: courierForm.phone?.trim() || undefined,
        password: courierForm.password,
      });
      setUsers((prev) => [courier, ...prev]);
      setCourierForm(EMPTY_COURIER_FORM);
      setSuccess(t("admin.courierCreated", { name: courier.name }));
      router.push(`/dashboard/admin/couriers/${courier.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setBusyKey(null);
    }
  };

  const handleApproveCourier = async (courier: PendingCourier) => {
    setBusyKey(`approve:${courier.id}`);
    setError("");
    setSuccess("");
    try {
      const approved = await adminService.approveCourier(courier.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === approved.id ? approved : u))
      );
      setPendingCouriers((prev) => prev.filter((c) => c.id !== courier.id));
      setSuccess(t("admin.courierApproved", { name: courier.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return <Header title={t("admin.title")} subtitle={t("common.loading")} />;
  }

  return (
    <>
      <Header title={t("admin.title")} subtitle={t("admin.subtitle")} />

      {(error || success) && (
        <Card className="mb-6">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : (
            <p className="text-sm text-emerald-700">{success}</p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("admin.registeredAccounts")}</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("admin.totalCouriers")}</p>
              <p className="text-2xl font-bold text-slate-900">{couriers.length}</p>
              {pendingCouriers.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {pendingCouriers.length} {t("admin.pendingCouriers").toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("admin.totalRestaurants")}</p>
              <p className="text-2xl font-bold text-slate-900">{restaurants.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={activeTab === "accounts" ? "primary" : "outline"}
            onClick={() => setActiveTab("accounts")}
          >
            {t("admin.tabAccounts")}
          </Button>
          <Button
            variant={activeTab === "couriers" ? "primary" : "outline"}
            onClick={() => setActiveTab("couriers")}
          >
            {t("admin.tabCouriers")}
          </Button>
          <Button
            variant={activeTab === "restaurants" ? "primary" : "outline"}
            onClick={() => setActiveTab("restaurants")}
          >
            {t("admin.tabRestaurants")}
          </Button>
        </div>
      </Card>

      {activeTab === "accounts" && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t("admin.accounts")}</h2>
          </div>

          <div className="space-y-4">
            {nonCourierUsers.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const canToggleModerator =
                Boolean(currentUser?.isSuperadmin) && !user.isSuperadmin;
              const canDeleteUser =
                !isSelf &&
                !user.isSuperadmin &&
                !(currentUser?.isModerator && user.isModerator);

              return (
                <div
                  key={user.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{user.name}</h3>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {user.role}
                      </span>
                      {user.isSuperadmin && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          {t("admin.superadmin")}
                        </span>
                      )}
                      {!user.isSuperadmin && user.isModerator && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          {t("admin.moderator")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {t("admin.userMeta", {
                        count: String(user.restaurantCount),
                        createdAt: new Date(user.createdAt).toLocaleString(),
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                    {canToggleModerator && (
                      <Button
                        variant="outline"
                        disabled={busyKey === `moderator:${user.id}`}
                        onClick={() => handleModeratorToggle(user)}
                      >
                        {user.isModerator
                          ? t("admin.revokeModerator")
                          : t("admin.makeModerator")}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      disabled={!canDeleteUser || busyKey === `user:${user.id}`}
                      onClick={() => handleUserDelete(user)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("admin.deleteUser")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === "couriers" && (
        <>
          {pendingCouriers.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("admin.pendingCouriers")}
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {t("admin.pendingCouriersDescription")}
              </p>
              <div className="space-y-4">
                {pendingCouriers.map((courier) => (
                  <div
                    key={courier.id}
                    className="border border-amber-200 rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-amber-50/50"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">{courier.name}</h3>
                      <p className="text-sm text-slate-600">{courier.email}</p>
                      {courier.phone && (
                        <p className="text-sm text-slate-500">{courier.phone}</p>
                      )}
                      {courier.courierCompanyName && (
                        <p className="text-sm text-amber-700 mt-1">
                          {courier.courierCompanyName}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mt-2">
                        {t("admin.courierMeta", {
                          createdAt: new Date(courier.createdAt).toLocaleString(),
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApproveCourier(courier)}
                      disabled={busyKey === `approve:${courier.id}`}
                    >
                      {busyKey === `approve:${courier.id}`
                        ? t("common.loading")
                        : t("admin.approveCourier")}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {currentUser?.isSuperadmin && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("admin.courierAccess")}
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {t("admin.courierAccessDescription")}
              </p>

              <form className="space-y-4" onSubmit={handleCreateCourier}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("admin.courierName")}
                    value={courierForm.name}
                    onChange={(event) =>
                      setCourierForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder={t("admin.courierNamePlaceholder")}
                    required
                  />
                  <Input
                    type="email"
                    label={t("auth.email")}
                    value={courierForm.email}
                    onChange={(event) =>
                      setCourierForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="courier@example.com"
                    required
                  />
                  <Input
                    label={t("auth.phone")}
                    value={courierForm.phone}
                    onChange={(event) =>
                      setCourierForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder={t("admin.courierPhonePlaceholder")}
                  />
                  <Input
                    type="password"
                    label={t("auth.password")}
                    value={courierForm.password}
                    onChange={(event) =>
                      setCourierForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder={t("admin.courierPasswordPlaceholder")}
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-500">
                    {t("admin.courierSelfSignupDisabled")}
                  </p>
                  <Button type="submit" disabled={busyKey === "courier:create"}>
                    {busyKey === "courier:create"
                      ? t("admin.courierCreating")
                      : t("admin.courierCreate")}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                {t("admin.courierList")}
              </h2>
            </div>

            {couriers.length === 0 ? (
              <p className="text-sm text-slate-500">{t("admin.courierEmpty")}</p>
            ) : (
              <div className="space-y-4">
                {couriers.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-slate-200"
                  >
                    <Link
                      href={`/dashboard/admin/couriers/${user.id}`}
                      className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {user.name || user.email}
                        </h3>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          {t("admin.tabCouriers")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-slate-500 mt-1">{user.phone}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-2">
                        {t("admin.courierMeta", {
                          createdAt: new Date(user.createdAt).toLocaleString(),
                        })}
                      </p>
                    </Link>

                    <div className="flex gap-3">
                      <Button
                        variant="danger"
                        disabled={busyKey === `user:${user.id}`}
                        onClick={() => void handleUserDelete(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("admin.deleteUser")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === "restaurants" && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t("admin.restaurants")}</h2>
          </div>

          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{restaurant.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{restaurant.address}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {t("admin.restaurantMeta", {
                      owner: restaurant.owner.email,
                      createdAt: new Date(restaurant.createdAt).toLocaleString(),
                    })}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/restaurants`)}
                  >
                    {t("admin.openManagement")}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busyKey === `restaurant:${restaurant.id}`}
                    onClick={() => handleRestaurantDelete(restaurant)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("admin.deleteRestaurant")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
