import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, requireRole } from "../../middleware/auth";
import { HttpError, parseId } from "../../utils/http";

const menuRouter = Router();

const categoryCreateSchema = z.object({
  restaurant_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
});

const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1),
});

const menuItemCreateSchema = z.object({
  restaurant_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  image: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  available: z.boolean().optional(),
});

const menuItemUpdateSchema = z.object({
  category_id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative().optional(),
  image: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  available: z.boolean().optional(),
});

function mapMenuItem(item: {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
}) {
  return {
    id: item.id,
    category_id: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    available: item.available,
  };
}

function mapCategory(category: {
  id: number;
  restaurantId: number;
  name: string;
  items: Array<{
    id: number;
    categoryId: number;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    available: boolean;
  }>;
}) {
  return {
    id: category.id,
    restaurant_id: category.restaurantId,
    name: category.name,
    items: category.items.map(mapMenuItem),
  };
}

async function assertRestaurantAccess(
  restaurantId: number,
  auth: { userId: number; role: string }
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) {
    throw new HttpError(404, "Restaurant not found");
  }
  if (auth.role !== UserRole.ADMIN && restaurant.ownerId !== auth.userId) {
    throw new HttpError(403, "Forbidden");
  }
  return restaurant;
}

menuRouter.get("/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = parseId(String(req.params.restaurantId), "restaurant id");
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  res.json(categories.map(mapCategory));
});

menuRouter.post(
  "/category",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const input = categoryCreateSchema.parse(req.body);
    await assertRestaurantAccess(input.restaurant_id, req.auth!);

    const category = await prisma.menuCategory.create({
      data: {
        restaurantId: input.restaurant_id,
        name: input.name,
      },
      include: { items: true },
    });

    res.status(201).json(mapCategory(category));
  }
);

menuRouter.put(
  "/category/:categoryId",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const categoryId = parseId(String(req.params.categoryId), "category id");
    const input = categoryUpdateSchema.parse(req.body);

    const existing = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { items: true, restaurant: true },
    });
    if (!existing) {
      throw new HttpError(404, "Category not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.restaurant.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    const category = await prisma.menuCategory.update({
      where: { id: categoryId },
      data: { name: input.name },
      include: { items: true },
    });

    res.json(mapCategory(category));
  }
);

menuRouter.delete(
  "/category/:categoryId",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const categoryId = parseId(String(req.params.categoryId), "category id");
    const existing = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { restaurant: true },
    });
    if (!existing) {
      throw new HttpError(404, "Category not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.restaurant.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.menuCategory.delete({
      where: { id: categoryId },
    });

    res.status(204).send();
  }
);

menuRouter.post(
  "/item",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const input = menuItemCreateSchema.parse(req.body);
    await assertRestaurantAccess(input.restaurant_id, req.auth!);

    const category = await prisma.menuCategory.findUnique({
      where: { id: input.category_id },
    });
    if (!category || category.restaurantId !== input.restaurant_id) {
      throw new HttpError(400, "Category does not belong to restaurant");
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId: input.restaurant_id,
        categoryId: input.category_id,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        image: input.image ?? input.imageUrl ?? null,
        available: input.available ?? true,
      },
    });

    res.status(201).json(mapMenuItem(item));
  }
);

menuRouter.put(
  "/item/:itemId",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const itemId = parseId(String(req.params.itemId), "item id");
    const input = menuItemUpdateSchema.parse(req.body);

    const existing = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: true },
    });
    if (!existing) {
      throw new HttpError(404, "Menu item not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.restaurant.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    if (input.category_id !== undefined) {
      const category = await prisma.menuCategory.findUnique({
        where: { id: input.category_id },
      });
      if (!category || category.restaurantId !== existing.restaurantId) {
        throw new HttpError(400, "Category does not belong to restaurant");
      }
    }

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(input.category_id !== undefined
          ? { categoryId: input.category_id }
          : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description ?? null }
          : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.image !== undefined || input.imageUrl !== undefined
          ? { image: input.image ?? input.imageUrl ?? null }
          : {}),
        ...(input.available !== undefined ? { available: input.available } : {}),
      },
    });

    res.json(mapMenuItem(item));
  }
);

menuRouter.delete(
  "/item/:itemId",
  authenticate,
  requireRole([UserRole.RESTAURANT, UserRole.ADMIN]),
  async (req, res) => {
    const itemId = parseId(String(req.params.itemId), "item id");
    const existing = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { restaurant: true },
    });
    if (!existing) {
      throw new HttpError(404, "Menu item not found");
    }
    if (
      req.auth!.role !== UserRole.ADMIN &&
      existing.restaurant.ownerId !== req.auth!.userId
    ) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });
    res.status(204).send();
  }
);

export { menuRouter };
