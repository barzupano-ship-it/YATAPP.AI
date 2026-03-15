import { api } from "@/lib/api";

export interface Company {
  id: number;
  name: string;
  delivery_fee: number;
  phone: string | null;
  address: string | null;
  courier_count: number;
  created_at: string;
}

export interface Courier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CourierProfile {
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl: string;
  passportPhotoUrl: string;
  inn: string;
  passportNumber: string;
}

export const courierCompanyService = {
  async getMe(): Promise<Company> {
    return api.get<Company>("/courier-company/me");
  },

  async updateMe(data: {
    name?: string;
    delivery_fee?: number;
    phone?: string | null;
    address?: string | null;
  }): Promise<Company> {
    return api.patch<Company>("/courier-company/me", data);
  },

  async getCouriers(): Promise<Courier[]> {
    return api.get<Courier[]>("/courier-company/couriers");
  },

  async createCourier(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Courier> {
    return api.post<Courier>("/courier-company/couriers", data);
  },

  async removeCourier(courierId: number): Promise<void> {
    await api.delete(`/courier-company/couriers/${courierId}`);
  },

  async getCourierProfile(courierId: number): Promise<CourierProfile> {
    const data = await api.get<Record<string, unknown>>(
      `/courier-company/couriers/${courierId}/profile`
    );
    return {
      firstName: String(data.first_name ?? ""),
      lastName: String(data.last_name ?? ""),
      phone: String(data.phone ?? ""),
      profilePhotoUrl: String(data.profile_photo ?? ""),
      passportPhotoUrl: String(data.passport_photo ?? ""),
      inn: String(data.inn ?? ""),
      passportNumber: String(data.passport_number ?? ""),
    };
  },

  async updateCourierProfile(
    courierId: number,
    input: Partial<{
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      profilePhoto: string | null;
      passportPhoto: string | null;
      inn: string | null;
      passportNumber: string | null;
    }>
  ): Promise<{ courier: Courier; profile: CourierProfile }> {
    const body: Record<string, string | null | undefined> = {};
    if (input.firstName !== undefined) body.firstName = input.firstName;
    if (input.lastName !== undefined) body.lastName = input.lastName;
    if (input.phone !== undefined) body.phone = input.phone;
    if (input.profilePhoto !== undefined) body.profilePhoto = input.profilePhoto;
    if (input.passportPhoto !== undefined) body.passportPhoto = input.passportPhoto;
    if (input.inn !== undefined) body.inn = input.inn;
    if (input.passportNumber !== undefined) body.passportNumber = input.passportNumber;

    const data = await api.patch<{
      courier: Courier;
      profile: Record<string, unknown>;
    }>(`/courier-company/couriers/${courierId}/profile`, body);
    return {
      courier: data.courier,
      profile: {
        firstName: String(data.profile.first_name ?? ""),
        lastName: String(data.profile.last_name ?? ""),
        phone: String(data.profile.phone ?? ""),
        profilePhotoUrl: String(data.profile.profile_photo ?? ""),
        passportPhotoUrl: String(data.profile.passport_photo ?? ""),
        inn: String(data.profile.inn ?? ""),
        passportNumber: String(data.profile.passport_number ?? ""),
      },
    };
  },
};
