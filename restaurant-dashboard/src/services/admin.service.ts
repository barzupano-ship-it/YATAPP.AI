import { Restaurant } from "@/services/restaurant.service";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isModerator: boolean;
  isSuperadmin: boolean;
  isActive: boolean;
  restaurantCount: number;
  createdAt: string;
}

export interface AdminRestaurant extends Restaurant {
  owner: {
    id: string;
    name: string;
    email: string;
    isModerator: boolean;
    isSuperadmin: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export interface PendingCourier {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  courierCompanyId: number | null;
  courierCompanyName: string | null;
}

export interface CreateCourierInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface CourierProfile {
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl?: string;
  passportPhotoUrl?: string;
  inn: string;
  passportNumber: string;
}

export interface UpdateCourierProfileInput {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  profilePhoto?: string | null;
  passportPhoto?: string | null;
  inn?: string | null;
  passportNumber?: string | null;
}

function mapAdminUser(user: Record<string, unknown>): AdminUser {
  return {
    id: String(user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    phone: (user.phone as string | null | undefined) ?? null,
    role: String(user.role || ""),
    isModerator: Boolean(user.isModerator),
    isSuperadmin: Boolean(user.isSuperadmin),
    isActive: Boolean(user.isActive),
    restaurantCount: Number(user.restaurant_count || 0),
    createdAt: String(user.created_at || ""),
  };
}

function resolveImageUrl(image: unknown, apiBase: string): string | undefined {
  const value = typeof image === "string" ? image.trim() : "";
  if (!value) return undefined;
  if (/^(data:|https?:\/\/|blob:)/i.test(value)) return value;
  return `${apiBase}${value}`;
}

function mapCourierProfile(
  profile: Record<string, unknown>,
  apiBase: string
): CourierProfile {
  return {
    firstName: String(profile.first_name || ""),
    lastName: String(profile.last_name || ""),
    phone: String(profile.phone || ""),
    profilePhotoUrl: resolveImageUrl(profile.profile_photo, apiBase),
    passportPhotoUrl: resolveImageUrl(profile.passport_photo, apiBase),
    inn: String(profile.inn || ""),
    passportNumber: String(profile.passport_number || ""),
  };
}

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    const { api } = await import("@/lib/api");
    const data = await api.get<Record<string, unknown>[]>("/admin/users");

    return (Array.isArray(data) ? data : []).map(mapAdminUser);
  },

  async setModerator(userId: string, enabled: boolean): Promise<AdminUser> {
    const { api } = await import("@/lib/api");
    const user = await api.patch<Record<string, unknown>>(
      `/admin/users/${userId}/moderator`,
      { enabled }
    );

    return mapAdminUser(user);
  },

  async getPendingCouriers(): Promise<PendingCourier[]> {
    const { api } = await import("@/lib/api");
    const data = await api.get<Record<string, unknown>[]>("/admin/couriers/pending");
    return (Array.isArray(data) ? data : []).map((u) => ({
      id: String(u.id),
      name: String(u.name || ""),
      email: String(u.email || ""),
      phone: (u.phone as string | null | undefined) ?? null,
      createdAt: String(u.created_at || ""),
      courierCompanyId: u.courier_company_id != null ? Number(u.courier_company_id) : null,
      courierCompanyName: (u.courier_company_name as string | null) ?? null,
    }));
  },

  async approveCourier(userId: string): Promise<AdminUser> {
    const { api } = await import("@/lib/api");
    const user = await api.patch<Record<string, unknown>>(
      `/admin/couriers/${userId}/approve`
    );
    return mapAdminUser(user);
  },

  async createCourier(input: CreateCourierInput): Promise<AdminUser> {
    const { api } = await import("@/lib/api");
    const user = await api.post<Record<string, unknown>>("/admin/couriers", input);
    return mapAdminUser(user);
  },

  async getCourierProfile(userId: string): Promise<CourierProfile> {
    const { api, getApiBase } = await import("@/lib/api");
    const apiBase = getApiBase();
    const profile = await api.get<Record<string, unknown>>(
      `/admin/couriers/${userId}/profile`
    );
    return mapCourierProfile(profile, apiBase);
  },

  async updateCourierProfile(
    userId: string,
    input: UpdateCourierProfileInput
  ): Promise<{ user: AdminUser; profile: CourierProfile }> {
    const { api, getApiBase } = await import("@/lib/api");
    const apiBase = getApiBase();
    const data = await api.patch<{
      user: Record<string, unknown>;
      profile: Record<string, unknown>;
    }>(`/admin/couriers/${userId}/profile`, input);

    return {
      user: mapAdminUser(data.user),
      profile: mapCourierProfile(data.profile, apiBase),
    };
  },

  async deleteUser(userId: string): Promise<void> {
    const { api } = await import("@/lib/api");
    await api.delete(`/admin/users/${userId}`);
  },

  async getRestaurants(): Promise<AdminRestaurant[]> {
    const { api, getApiBase } = await import("@/lib/api");
    const apiBase = getApiBase();
    const data = await api.get<Record<string, unknown>[]>("/admin/restaurants");

    return (Array.isArray(data) ? data : []).map((restaurant) => {
      const owner = (restaurant.owner as Record<string, unknown> | undefined) ?? {};

      return {
        id: String(restaurant.id),
        name: String(restaurant.name || ""),
        address: String(restaurant.address || ""),
        description: (restaurant.description as string | undefined) || undefined,
        logoUrl: resolveImageUrl(restaurant.logo, apiBase),
        coverImageUrl: resolveImageUrl(restaurant.cover_image, apiBase),
        isActive: Boolean(restaurant.is_active),
        createdAt: String(restaurant.created_at || ""),
        owner: {
          id: String(owner.id || ""),
          name: String(owner.name || ""),
          email: String(owner.email || ""),
          isModerator: Boolean(owner.isModerator),
          isSuperadmin: Boolean(owner.isSuperadmin),
        },
      };
    });
  },

  async deleteRestaurant(restaurantId: string): Promise<void> {
    const { api } = await import("@/lib/api");
    await api.delete(`/admin/restaurants/${restaurantId}`);
  },
};
