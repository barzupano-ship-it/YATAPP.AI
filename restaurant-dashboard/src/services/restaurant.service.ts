const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

function resolveRestaurantImageUrl(
  image: unknown,
  apiBase: string
): string | undefined {
  const value = typeof image === "string" ? image.trim() : "";
  if (!value) return undefined;
  if (/^(data:|https?:\/\/|blob:)/i.test(value)) return value;
  return `${apiBase}${value}`;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  cuisine?: string;
  description?: string;
  logoUrl?: string;
  logo?: string;
  coverImageUrl?: string;
  imageUrl?: string;
  openingHours?: string;
  deliveryRadius?: number;
  delivery_time?: number;
  deliveryTime?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  alifBankCardNumber?: string;
  alifBankWalletNumber?: string;
  dcBankCardNumber?: string;
  dcBankWalletNumber?: string;
}

const MOCK_RESTAURANT: Restaurant = {
  id: "rest-1",
  name: "The Golden Fork",
  address: "123 Main Street, Downtown",
  phone: "+1 (555) 123-4567",
  email: "contact@goldenfork.com",
  cuisine: "Italian, Mediterranean",
  description:
    "Authentic Italian cuisine with a modern twist. Fresh ingredients, homemade pasta.",
  openingHours: "11:00 AM - 10:00 PM",
  deliveryRadius: 5,
  deliveryTime: "30-45 min",
};

let mockData = { ...MOCK_RESTAURANT };

function mapRestaurant(
  data: Record<string, unknown>,
  apiBase: string
): Restaurant {
  return {
    id: String(data.id || ""),
    name: (data.name as string) || "",
    address: (data.address as string) || "",
    city: (data.city as string) || undefined,
    description: (data.description as string) || undefined,
    phone: (data.phone as string) || undefined,
    email: (data.email as string) || undefined,
    cuisine: (data.cuisine as string) || undefined,
    logoUrl: resolveRestaurantImageUrl(data.logo, apiBase),
    coverImageUrl: resolveRestaurantImageUrl(data.cover_image, apiBase),
    openingHours: (data.opening_hours as string) || undefined,
    deliveryRadius:
      typeof data.delivery_radius === "number"
        ? data.delivery_radius
        : data.delivery_radius != null
          ? Number(data.delivery_radius)
          : undefined,
    delivery_time:
      typeof data.delivery_time === "number"
        ? data.delivery_time
        : data.delivery_time != null
          ? Number(data.delivery_time)
          : undefined,
    deliveryTime: data.delivery_time ? `${data.delivery_time} min` : undefined,
    latitude:
      typeof data.latitude === "number"
        ? data.latitude
        : data.latitude != null
          ? Number(data.latitude)
          : undefined,
    longitude:
      typeof data.longitude === "number"
        ? data.longitude
        : data.longitude != null
          ? Number(data.longitude)
          : undefined,
    googleMapsUrl: (data.google_maps_url as string) || undefined,
    alifBankCardNumber: (data.alif_bank_card_number as string) || undefined,
    alifBankWalletNumber: (data.alif_bank_wallet_number as string) || undefined,
    dcBankCardNumber: (data.dc_bank_card_number as string) || undefined,
    dcBankWalletNumber: (data.dc_bank_wallet_number as string) || undefined,
  };
}

function buildRestaurantPayload(data: Partial<Restaurant>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.city !== undefined) payload.city = data.city;
  if (data.description !== undefined) payload.description = data.description;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.cuisine !== undefined) payload.cuisine = data.cuisine;
  if (data.logo !== undefined) payload.logo = data.logo;
  if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl;
  if (data.coverImageUrl !== undefined) payload.coverImageUrl = data.coverImageUrl;
  if (data.openingHours !== undefined) payload.opening_hours = data.openingHours;
  if (data.deliveryRadius !== undefined) payload.delivery_radius = data.deliveryRadius;
  if (data.delivery_time !== undefined) payload.delivery_time = data.delivery_time;
  if (data.latitude !== undefined) payload.latitude = data.latitude;
  if (data.longitude !== undefined) payload.longitude = data.longitude;
  if (data.googleMapsUrl !== undefined) payload.google_maps_url = data.googleMapsUrl;
  if (data.alifBankCardNumber !== undefined) payload.alif_bank_card_number = data.alifBankCardNumber;
  if (data.alifBankWalletNumber !== undefined) payload.alif_bank_wallet_number = data.alifBankWalletNumber;
  if (data.dcBankCardNumber !== undefined) payload.dc_bank_card_number = data.dcBankCardNumber;
  if (data.dcBankWalletNumber !== undefined) payload.dc_bank_wallet_number = data.dcBankWalletNumber;

  return payload;
}

export const restaurantService = {
  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      mockData = {
        ...mockData,
        ...data,
        id: `rest-${Date.now()}`,
      };
      return { ...mockData };
    }
    const { api, getApiBase } = await import("@/lib/api");
    const res = await api.post<Record<string, unknown>>(
      "/restaurants",
      buildRestaurantPayload(data)
    );
    return mapRestaurant(res, getApiBase());
  },

  async getRestaurant(id: string): Promise<Restaurant> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return { ...mockData };
    }
    const { api, getApiBase } = await import("@/lib/api");
    const data = await api.get<Record<string, unknown>>(`/restaurants/${id}`);
    return mapRestaurant(data, getApiBase());
  },

  async getOwnedRestaurants(): Promise<Restaurant[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return [{ ...mockData }];
    }
    const { api, getApiBase } = await import("@/lib/api");
    const apiBase = getApiBase();
    const data = await api.get<Record<string, unknown>[]>("/restaurants/owner/me");
    return (Array.isArray(data) ? data : []).map((restaurant) =>
      mapRestaurant(restaurant, apiBase)
    );
  },

  async updateRestaurant(
    id: string,
    data: Partial<Restaurant>
  ): Promise<Restaurant> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      mockData = { ...mockData, ...data };
      return { ...mockData };
    }
    const { api, getApiBase } = await import("@/lib/api");
    const res = await api.put<Record<string, unknown>>(
      `/restaurants/${id}`,
      buildRestaurantPayload(data)
    );
    return mapRestaurant(res, getApiBase());
  },

  async deleteRestaurant(id: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      if (mockData.id === id) {
        mockData = { ...MOCK_RESTAURANT, id: "" };
      }
      return;
    }
    const { api } = await import("@/lib/api");
    await api.delete(`/restaurants/${id}`);
  },
};
