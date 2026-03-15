"use client";

import { useState, useEffect } from "react";
import {
  authService,
  getUserChangedEventName,
  isMockAuthEnabled,
} from "@/services/auth.service";

function normalizeRestaurantId(value?: string): string | null {
  return value && /^\d+$/.test(value) ? value : null;
}

export function useRestaurantId(): string | null {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncRestaurantId = async () => {
      try {
        const user = authService.getStoredUser();
        const normalizedRestaurantId = normalizeRestaurantId(user?.restaurantId);

        if (normalizedRestaurantId) {
          if (isMounted) setRestaurantId(normalizedRestaurantId);
          return;
        }

        if (isMounted) setRestaurantId(null);

        if (
          isMockAuthEnabled() ||
          typeof window === "undefined" ||
          !localStorage.getItem("token")
        ) {
          return;
        }

        const { api } = await import("@/lib/api");
        const restaurants = await api.get<Array<{ id: number }>>(
          "/restaurants/owner/me"
        );
        const nextRestaurantId =
          restaurants.length > 0 ? String(restaurants[0].id) : null;

        if (!isMounted) return;

        if (user && nextRestaurantId) {
          authService.setStoredUser({ ...user, restaurantId: nextRestaurantId });
        } else {
          setRestaurantId(nextRestaurantId);
        }
      } catch {
        if (isMounted) setRestaurantId(null);
      }
    };

    void syncRestaurantId();

    const handleUserChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ restaurantId?: string } | null>;
      setRestaurantId(normalizeRestaurantId(customEvent.detail?.restaurantId));
    };

    window.addEventListener(getUserChangedEventName(), handleUserChanged);
    return () => {
      isMounted = false;
      window.removeEventListener(getUserChangedEventName(), handleUserChanged);
    };
  }, []);

  return restaurantId;
}
