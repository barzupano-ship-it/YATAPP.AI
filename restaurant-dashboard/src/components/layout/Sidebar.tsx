"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
  ShoppingBag,
  LogOut,
  ChefHat,
  Building2,
  Shield,
} from "lucide-react";
import {
  authService,
  getUserChangedEventName,
  userHasAdminAccess,
} from "@/services/auth.service";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const baseNavItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/restaurants", labelKey: "nav.restaurants", icon: Building2 },
  { href: "/dashboard/settings", labelKey: "nav.restaurantSettings", icon: Settings },
  { href: "/dashboard/menu", labelKey: "nav.menu", icon: UtensilsCrossed },
  { href: "/dashboard/orders", labelKey: "nav.orders", icon: ShoppingBag },
];

const adminNavItem = {
  href: "/dashboard/admin",
  labelKey: "nav.admin",
  icon: Shield,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const user = await authService.refreshStoredUser();
      if (isMounted) {
        setCanAccessAdmin(userHasAdminAccess(user));
      }
    };

    void syncUser();

    const handleUserChanged = () => {
      setCanAccessAdmin(userHasAdminAccess(authService.getStoredUser()));
    };

    window.addEventListener(getUserChangedEventName(), handleUserChanged);
    return () => {
      isMounted = false;
      window.removeEventListener(getUserChangedEventName(), handleUserChanged);
    };
  }, []);

  const navItems = canAccessAdmin
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg">{t("app.restaurant")}</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-orange-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <div className="px-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
