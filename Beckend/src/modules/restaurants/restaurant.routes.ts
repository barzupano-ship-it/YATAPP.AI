import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, requireRole } from "../../middleware/auth";
import { HttpError, parseId } from "../../utils/http";

const restaurantRouter = Router();

const restaurantInputSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  cuisine: z.string().trim().optional().nullable(),
  logo: z.string().trim().optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  cover_image: z.string().trim().optional().nullable(),
  coverImageUrl: z.string().trim().optional().nullable(),
  delivery_time: z.coerce.number().int().positive().optional(),
  opening_hours: z.string().trim().optional().nullable(),
  delivery_radius: z.coerce.number().positive().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  google_maps_url: z.string().trim().url().optional().nullable(),
  googleMapsUrl: z.string().trim().url().optional().nullable(),
  alif_bank_card_number: z.string().trim().optional().nullable(),
  alifBankCardNumber: z.string().trim().optional().nullable(),
  alif_bank_wallet_number: z.string().trim().optional().nullable(),
  alifBankWalletNumber: z.string().trim().optional().nullable(),
  dc_bank_card_number: z.string().trim().optional().nullable(),
  dcBankCardNumber: z.string().trim().optional().nullable(),
  dc_bank_wallet_number: z.string().trim().optional().nullable(),
  dcBankWalletNumber: z.string().trim().optional().nullable(),
});

const restaurantUpdateSchema = restaurantInputSchema.partial();

function mapRestaurant(restaurant: {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  city: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  cuisine: string | null;
  logo: string | null;
  coverImage: string | null;
  deliveryTime: number;
  openingHours: string | null;
  deliveryRadius: number | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  alifBankCardNumber: string | null;
  alifBankWalletNumber: string | null;
  dcBankCardNumber: string | null;
  dcBankWalletNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: restaurant.id,
    owner_id: restaurant.ownerId,
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    description: restaurant.description,
    phone: restaurant.phone,
    email: restaurant.email,
    cuisine: restaurant.cuisine,
    logo: restaurant.logo,
    cover_image: restaurant.coverImage,
    delivery_time: restaurant.deliveryTime,
    opening_hours: restaurant.openingHours,
    delivery_radius: restaurant.deliveryRadius,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    google_maps_url: restaurant.googleMapsUrl,
    alif_bank_card_number: restaurant.alifBankCardNumber,
    alif_bank_wallet_number: restaurant.alifBankWalletNumber,
    dc_bank_card_number: restaurant.dcBankCardNumber,
    dc_bank_wallet_number: restaurant.dcBankWalletNumber,
    is_active: restaurant.isActive,
    created_at: restaurant.createdAt,
    updated_at: restaurant.updatedAt,
  };
}

function toRestaurantData(input: z.infer<typeof restaurantInputSchema>) {
  return {
    name: input.name,
    address: input.address,
    city: input.city ?? null,
    description: input.description ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    cuisine: input.cuisine ?? null,
    logo: input.logo ?? input.logoUrl ?? null,
    coverImage: input.cover_image ?? input.coverImageUrl ?? null,
    deliveryTime: input.delivery_time ?? 30,
    openingHours: input.opening_hours ?? null,
    deliveryRadius: input.delivery_radius ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    googleMapsUrl: input.google_maps_url ?? input.googleMapsUrl ?? null,
    alifBankCardNumber: input.alif_bank_card_number ?? input.alifBankCardNumber ?? null,
    alifBankWalletNumber: input.alif_bank_wallet_number ?? input.alifBankWalletNumber ?? null,
    dcBankCardNumber: input.dc_bank_card_number ?? input.dcBankCardNumber ?? null,
    dcBankWalletNumber: input.dc_bank_wallet_number ?? input.dcBankWalletNumber ?? null,
  };
}

restaurantRouter.get("/", async (req, res) => {
  const cityParam = typeof req.query.city === "string" ? req.query.city.trim() : undefined;
  const where =
    cityParam
      ? {
          isActive: true,
          OR: [{ city: cityParam }, { city: null }],
        }
      : { isActive: true };
  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: { id: "desc" },
  });
  res.json(restaurants.map(mapRestaurant));
});

restaurantRouter.get(
  "/owner/me",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.auth!.userId },
      orderBy: { id: "asc" },
    });
    res.json(restaurants.map(mapRestaurant));
  }
);

restaurantRouter.post(
  "/",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const input = restaurantInputSchema.parse(req.body);

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: req.auth!.userId,
        ...toRestaurantData(input),
      },
    });

    res.status(201).json(mapRestaurant(restaurant));
  }
);

restaurantRouter.get("/:id", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseId(String(req.params.id)) },
  });
  if (!restaurant) {
    throw new HttpError(404, "Restaurant not found");
  }
  res.json(mapRestaurant(restaurant));
});

restaurantRouter.put(
  "/:id",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const restaurantId = parseId(String(req.params.id), "restaurant id");
    const input = restaurantUpdateSchema.parse(req.body);

    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!existing) {
      throw new HttpError(404, "Restaurant not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    const baseData: Record<string, unknown> = {
      ...(input.description !== undefined
        ? { description: input.description ?? null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
      ...(input.email !== undefined ? { email: input.email ?? null } : {}),
      ...(input.cuisine !== undefined ? { cuisine: input.cuisine ?? null } : {}),
      ...(input.logo !== undefined || input.logoUrl !== undefined
        ? { logo: input.logo ?? input.logoUrl ?? null }
        : {}),
      ...(input.cover_image !== undefined || input.coverImageUrl !== undefined
        ? { coverImage: input.cover_image ?? input.coverImageUrl ?? null }
        : {}),
      ...(input.opening_hours !== undefined
        ? { openingHours: input.opening_hours ?? null }
        : {}),
      ...(input.delivery_radius !== undefined
        ? { deliveryRadius: input.delivery_radius }
        : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    };

    const rawFields: string[] = [];
    const rawValues: (string | number | null)[] = [];
    const googleMapsUrl =
      input.google_maps_url ?? input.googleMapsUrl;
    const alifCard = input.alif_bank_card_number ?? input.alifBankCardNumber;
    const alifWallet =
      input.alif_bank_wallet_number ?? input.alifBankWalletNumber;
    const dcCard = input.dc_bank_card_number ?? input.dcBankCardNumber;
    const dcWallet =
      input.dc_bank_wallet_number ?? input.dcBankWalletNumber;

    if (googleMapsUrl !== undefined) {
      rawFields.push("googleMapsUrl = ?");
      rawValues.push(googleMapsUrl);
    }
    if (input.name !== undefined) {
      rawFields.push("name = ?");
      rawValues.push(input.name);
    }
    if (input.address !== undefined) {
      rawFields.push("address = ?");
      rawValues.push(input.address);
    }
    if (input.city !== undefined) {
      rawFields.push("city = ?");
      rawValues.push(input.city);
    }
    if (input.delivery_time !== undefined) {
      rawFields.push("deliveryTime = ?");
      rawValues.push(input.delivery_time);
    }
    if (alifCard !== undefined) {
      rawFields.push("alifBankCardNumber = ?");
      rawValues.push(alifCard);
    }
    if (alifWallet !== undefined) {
      rawFields.push("alifBankWalletNumber = ?");
      rawValues.push(alifWallet);
    }
    if (dcCard !== undefined) {
      rawFields.push("dcBankCardNumber = ?");
      rawValues.push(dcCard);
    }
    if (dcWallet !== undefined) {
      rawFields.push("dcBankWalletNumber = ?");
      rawValues.push(dcWallet);
    }

    const restaurant = await prisma.$transaction(async (tx) => {
      if (Object.keys(baseData).length > 0) {
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: baseData,
        });
      }

      if (rawFields.length > 0) {
        rawFields.push("updatedAt = ?");
        rawValues.push(new Date().toISOString());
        rawValues.push(restaurantId);
        await tx.$executeRawUnsafe(
          `UPDATE Restaurant SET ${rawFields.join(", ")} WHERE id = ?`,
          ...rawValues
        );
      }

      const updated = await tx.restaurant.findUniqueOrThrow({
        where: { id: restaurantId },
      });
      return updated;
    });

    res.json(mapRestaurant(restaurant));
  }
);

restaurantRouter.delete(
  "/:id",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const restaurantId = parseId(String(req.params.id), "restaurant id");

    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!existing) {
      throw new HttpError(404, "Restaurant not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    res.status(204).send();
  }
);

export { restaurantRouter };
