const TOKEN_KEY = "token";
const USER_KEY = "courier-company-user";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { api } = await import("@/lib/api");
    const res = await api.post<{
      user: { id: number; email: string; name: string; phone?: string | null; role?: string };
      token: string;
    }>("/auth/login", { email, password });
    if (res.user.role !== "courier_company" && res.user.role !== "admin") {
      throw new Error("Access denied. Courier company account required.");
    }
    setToken(res.token);
    const user: User = {
      id: String(res.user.id),
      email: res.user.email,
      name: res.user.name,
      phone: res.user.phone,
      role: res.user.role,
    };
    setStoredUser(user);
    return user;
  },

  async register(data: {
    company_name: string;
    owner_name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    const { api } = await import("@/lib/api");
    const res = await api.post<{
      user: { id: number; email: string; name: string; phone?: string | null; role?: string };
      token: string;
    }>("/courier-company/register", data);
    setToken(res.token);
    const user: User = {
      id: String(res.user.id),
      email: res.user.email,
      name: res.user.name,
      phone: res.user.phone,
      role: "courier_company",
    };
    setStoredUser(user);
    return user;
  },

  logout(): void {
    setStoredUser(null);
    setToken(null);
  },

  getStoredUser,
  setStoredUser,
};
