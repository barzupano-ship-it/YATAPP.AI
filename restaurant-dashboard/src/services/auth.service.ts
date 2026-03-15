const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

const USER_STORAGE_KEY = "restaurant-user";
const TOKEN_STORAGE_KEY = "token";
const USER_CHANGED_EVENT = "restaurant-user-changed";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  isModerator?: boolean;
  isSuperadmin?: boolean;
  restaurantId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const mockRegister = async (data: {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
}): Promise<User> => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    id: "1",
    email: data.email,
    name: data.ownerName,
    role: "restaurant",
    isModerator: false,
    isSuperadmin: false,
    restaurantId: "rest-1",
  };
};

const mockLogin = async (email: string, password: string): Promise<User> => {
  await new Promise((r) => setTimeout(r, 500));
  if (email && password) {
    return {
      id: "1",
      email,
      name: "Restaurant Owner",
      role: "restaurant",
      isModerator: false,
      isSuperadmin: false,
      restaurantId: "rest-1",
    };
  }
  throw new Error("Invalid credentials");
};

function emitUserChanged(user: User | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<User | null>(USER_CHANGED_EVENT, {
      detail: user,
    })
  );
}

function persistToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function persistUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  emitUserChanged(user);
}

function hasStoredToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

function normalizeStoredUser(user: User | null): User | null {
  if (!user) return null;
  if (!user.restaurantId) return user;

  return /^\d+$/.test(user.restaurantId)
    ? user
    : {
        ...user,
        restaurantId: undefined,
      };
}

function mapApiUser(user: {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  isModerator?: boolean;
  isSuperadmin?: boolean;
}): User {
  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
    isModerator: user.isModerator ?? false,
    isSuperadmin: user.isSuperadmin ?? false,
  };
}

function hasAdminAccess(user: User | null): boolean {
  return Boolean(user?.isSuperadmin || user?.isModerator);
}

export function getUserChangedEventName(): string {
  return USER_CHANGED_EVENT;
}

export function isMockAuthEnabled(): boolean {
  return USE_MOCK_AUTH;
}

export function userHasAdminAccess(user: User | null): boolean {
  return hasAdminAccess(user);
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    if (USE_MOCK_AUTH) {
      const user = await mockLogin(email, password);
      persistUser(user);
      return user;
    }
    const { api } = await import("@/lib/api");
    const res = await api.post<{
      user: {
        id: number;
        email: string;
        name: string;
        phone?: string | null;
        role?: string;
        isModerator?: boolean;
        isSuperadmin?: boolean;
      };
      token: string;
    }>("/auth/login", { email, password });
    persistToken(res.token);
    const user = await this.hydrateUserWithRestaurants(mapApiUser(res.user), api);
    persistUser(user);
    return user;
  },

  async register(data: {
    restaurantName: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    address: string;
  }): Promise<User> {
    if (USE_MOCK_AUTH) {
      const user = await mockRegister(data);
      persistUser(user);
      return user;
    }
    const { api } = await import("@/lib/api");
    const res = await api.post<{
      user: {
        id: number;
        email: string;
        name: string;
        phone?: string | null;
        role?: string;
        isModerator?: boolean;
        isSuperadmin?: boolean;
      };
      token: string;
    }>("/auth/register", {
      name: data.ownerName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: "restaurant",
    });
    persistToken(res.token);
    const user = mapApiUser(res.user);
    const restaurantRes = await api.post<{ id: number }>("/restaurants", {
      name: data.restaurantName,
      address: data.address,
      delivery_time: 30,
    });
    user.restaurantId = String(restaurantRes.id);
    persistUser(user);
    return user;
  },

  logout(): void {
    persistUser(null);
    persistToken(null);
  },

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    if (!USE_MOCK_AUTH && !hasStoredToken()) {
      persistUser(null);
      return null;
    }
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;

    try {
      const user = normalizeStoredUser(JSON.parse(stored) as User);
      if (user?.restaurantId === undefined) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    } catch {
      persistUser(null);
      return null;
    }
  },

  setStoredUser(user: User): void {
    persistUser(user);
  },

  async refreshStoredUser(): Promise<User | null> {
    if (USE_MOCK_AUTH) {
      return this.getStoredUser();
    }
    if (!hasStoredToken()) {
      persistUser(null);
      return null;
    }

    try {
      const { api } = await import("@/lib/api");
      const apiUser = await api.get<{
        id: number;
        email: string;
        name: string;
        phone?: string | null;
        role?: string;
        isModerator?: boolean;
        isSuperadmin?: boolean;
      }>("/auth/me");
      const user = await this.hydrateUserWithRestaurants(mapApiUser(apiUser), api);
      persistUser(user);
      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  async hydrateUserWithRestaurants(
    user: User,
    apiClient?: {
      get: <T>(path: string) => Promise<T>;
    }
  ): Promise<User> {
    const client =
      apiClient ?? ((await import("@/lib/api")).api as { get: <T>(path: string) => Promise<T> });

    if (user.role !== "restaurant" && user.role !== "admin") {
      return user;
    }

    try {
      const restaurants = await client.get<{ id: number }[]>("/restaurants/owner/me");
      if (restaurants?.length) {
        return {
          ...user,
          restaurantId: String(restaurants[0].id),
        };
      }
    } catch {
      // User has no owned restaurants or cannot access this endpoint.
    }

    return user;
  },
};
