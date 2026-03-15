const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

function resolveMenuImageUrl(image: unknown, apiBase: string): string | undefined {
  const value = typeof image === "string" ? image.trim() : "";
  if (!value) return undefined;
  if (/^(data:|https?:\/\/|blob:)/i.test(value)) return value;
  return `${apiBase}${value}`;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  category_id?: number;
  imageUrl?: string;
  image?: string;
  available?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
  restaurant_id?: number;
}

let MOCK_MENU: MenuCategory[] = [
  {
    id: "cat-1",
    name: "Pizza",
    items: [
      {
        id: "item-1",
        name: "Margherita",
        description: "San Marzano tomatoes, fresh mozzarella, basil",
        price: 14.99,
        category: "Pizza",
        available: true,
      },
    ],
  },
  {
    id: "cat-2",
    name: "Burgers",
    items: [
      {
        id: "item-2",
        name: "Classic Burger",
        description: "Beef patty, lettuce, tomato, cheese",
        price: 12.99,
        category: "Burgers",
        available: true,
      },
    ],
  },
  {
    id: "cat-3",
    name: "Drinks",
    items: [
      {
        id: "item-3",
        name: "Fresh Lemonade",
        description: "House-made lemonade",
        price: 4.99,
        category: "Drinks",
        available: true,
      },
    ],
  },
  {
    id: "cat-4",
    name: "Desserts",
    items: [
      {
        id: "item-4",
        name: "Tiramisu",
        description: "Classic Italian dessert",
        price: 8.99,
        category: "Desserts",
        available: true,
      },
    ],
  },
];

export const menuService = {
  async getMenu(restaurantId: string): Promise<MenuCategory[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return [...MOCK_MENU];
    }
    const { api, getApiBase } = await import("@/lib/api");
    const apiBase = getApiBase();
    const data = await api.get<Record<string, unknown>[]>(
      `/menu/restaurant/${restaurantId}`
    );
    return (Array.isArray(data) ? data : []).map((c) => ({
      id: String(c.id),
      name: (c.name as string) || "",
      items: ((c.items as Record<string, unknown>[]) || []).map((i) => ({
        id: String(i.id),
        name: (i.name as string) || "",
        description: (i.description as string) || "",
        price: parseFloat(String(i.price || 0)),
        category: (c.name as string) || "",
        category_id: i.category_id as number,
        imageUrl: resolveMenuImageUrl(i.image, apiBase),
        available: i.available as boolean | undefined,
      })),
    }));
  },

  async addCategory(
    restaurantId: string,
    name: string
  ): Promise<MenuCategory> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const category: MenuCategory = {
        id: `cat-${Date.now()}`,
        name,
        items: [],
      };
      MOCK_MENU = [...MOCK_MENU, category];
      return category;
    }
    const { api } = await import("@/lib/api");
    const parsedRestaurantId = Number.parseInt(restaurantId, 10);
    if (!Number.isFinite(parsedRestaurantId)) {
      throw new Error("Restaurant session is outdated. Please sign in again.");
    }
    const data = await api.post<Record<string, unknown>>("/menu/category", {
      restaurant_id: parsedRestaurantId,
      name,
    });
    return {
      id: String(data.id),
      name: (data.name as string) || "",
      items: [],
    };
  },

  async updateCategory(
    _restaurantId: string,
    categoryId: string,
    name: string
  ): Promise<MenuCategory> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      MOCK_MENU = MOCK_MENU.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              name,
              items: c.items.map((i) => ({ ...i, category: name })),
            }
          : c
      );
      return MOCK_MENU.find((c) => c.id === categoryId)!;
    }
    const { api, getApiBase } = await import("@/lib/api");
    const data = await api.put<Record<string, unknown>>(
      `/menu/category/${categoryId}`,
      { name }
    );
    const items = ((data.items as Record<string, unknown>[]) || []).map((i) => ({
      id: String(i.id),
      name: (i.name as string) || "",
      description: (i.description as string) || "",
      price: parseFloat(String(i.price || 0)),
      category: (data.name as string) || "",
      category_id: i.category_id as number,
      imageUrl: i.image ? `${getApiBase()}${i.image}` : undefined,
    }));
    return {
      id: String(data.id),
      name: (data.name as string) || "",
      items,
    };
  },

  async deleteCategory(
    _restaurantId: string,
    categoryId: string
  ): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      MOCK_MENU = MOCK_MENU.filter((c) => c.id !== categoryId);
      return;
    }
    const { api } = await import("@/lib/api");
    await api.delete(`/menu/category/${categoryId}`);
  },

  async getCategory(
    restaurantId: string,
    categoryId: string
  ): Promise<MenuCategory | null> {
    const menu = await this.getMenu(restaurantId);
    return menu.find((c) => c.id === categoryId) ?? null;
  },

  async addItem(
    restaurantId: string,
    item: Omit<MenuItem, "id"> & { category_id?: number; categoryId?: string }
  ): Promise<MenuItem> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const newItem: MenuItem = {
        ...item,
        id: `item-${Date.now()}`,
      };
      const matchesCategory = (cat: MenuCategory) =>
        cat.id === item.categoryId ||
        cat.name === item.category ||
        (item.category_id != null && cat.id === String(item.category_id));
      MOCK_MENU = MOCK_MENU.map((cat) =>
        matchesCategory(cat)
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      );
      return newItem;
    }
    const { api, getApiBase } = await import("@/lib/api");
    const parsedRestaurantId = Number.parseInt(restaurantId, 10);
    const categoryId =
      item.category_id ??
      (typeof item.categoryId === "number"
        ? item.categoryId
        : parseInt(String(item.categoryId || "0"), 10));
    if (!Number.isFinite(parsedRestaurantId) || !Number.isFinite(categoryId)) {
      throw new Error("Menu context is outdated. Please reopen the category.");
    }
    const data = await api.post<Record<string, unknown>>("/menu/item", {
      restaurant_id: parsedRestaurantId,
      category_id: categoryId,
      name: item.name,
      price: item.price,
      description: item.description,
      image: item.imageUrl,
      available: item.available,
    });
    return {
      id: String(data.id),
      name: (data.name as string) || "",
      description: (data.description as string) || "",
      price: parseFloat(String(data.price || 0)),
      category: item.category,
      category_id: data.category_id as number | undefined,
      imageUrl: resolveMenuImageUrl(data.image, getApiBase()),
      available: (data.available as boolean | undefined) ?? item.available,
    };
  },

  async updateItem(
    restaurantId: string,
    itemId: string,
    updates: Partial<MenuItem>
  ): Promise<MenuItem> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const currentCategory = MOCK_MENU.find((c) =>
        c.items.some((i) => i.id === itemId)
      );
      const item = currentCategory?.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      const updated = { ...item, ...updates };
      MOCK_MENU = MOCK_MENU.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? updated : i)),
      }));
      return updated;
    }
    const { api, getApiBase } = await import("@/lib/api");
    const payload: Record<string, unknown> = {};
    if (updates.name) payload.name = updates.name;
    if (updates.price != null) payload.price = updates.price;
    if (updates.description != null) payload.description = updates.description;
    if (updates.category_id) payload.category_id = updates.category_id;
    if (updates.imageUrl !== undefined) payload.image = updates.imageUrl;
    if (updates.available !== undefined) payload.available = updates.available;
    const data = await api.put<Record<string, unknown>>(
      `/menu/item/${itemId}`,
      payload
    );
    return {
      id: String(data.id),
      name: (data.name as string) || "",
      description: (data.description as string) || "",
      price: parseFloat(String(data.price || 0)),
      category: (updates.category as string) || "",
      category_id: data.category_id as number | undefined,
      imageUrl: resolveMenuImageUrl(data.image, getApiBase()),
      available: data.available as boolean | undefined,
    };
  },

  async deleteItem(_restaurantId: string, itemId: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      MOCK_MENU = MOCK_MENU.map((c) => ({
        ...c,
        items: c.items.filter((i) => i.id !== itemId),
      }));
      return;
    }
    const { api } = await import("@/lib/api");
    await api.delete(`/menu/item/${itemId}`);
  },

  async toggleAvailability(
    restaurantId: string,
    itemId: string,
    available: boolean
  ): Promise<MenuItem> {
    return this.updateItem(restaurantId, itemId, { available });
  },
};
