"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const menuRouter = (0, express_1.Router)();
exports.menuRouter = menuRouter;
const categoryCreateSchema = zod_1.z.object({
    restaurant_id: zod_1.z.coerce.number().int().positive(),
    name: zod_1.z.string().trim().min(1),
});
const categoryUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
});
const menuItemCreateSchema = zod_1.z.object({
    restaurant_id: zod_1.z.coerce.number().int().positive(),
    category_id: zod_1.z.coerce.number().int().positive(),
    name: zod_1.z.string().trim().min(1),
    description: zod_1.z.string().trim().optional().nullable(),
    price: zod_1.z.coerce.number().nonnegative(),
    image: zod_1.z.string().trim().optional().nullable(),
    imageUrl: zod_1.z.string().trim().optional().nullable(),
    available: zod_1.z.boolean().optional(),
});
const menuItemUpdateSchema = zod_1.z.object({
    category_id: zod_1.z.coerce.number().int().positive().optional(),
    name: zod_1.z.string().trim().min(1).optional(),
    description: zod_1.z.string().trim().optional().nullable(),
    price: zod_1.z.coerce.number().nonnegative().optional(),
    image: zod_1.z.string().trim().optional().nullable(),
    imageUrl: zod_1.z.string().trim().optional().nullable(),
    available: zod_1.z.boolean().optional(),
});
function mapMenuItem(item) {
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
function mapCategory(category) {
    return {
        id: category.id,
        restaurant_id: category.restaurantId,
        name: category.name,
        items: category.items.map(mapMenuItem),
    };
}
async function assertRestaurantAccess(restaurantId, auth) {
    const restaurant = await prisma_1.prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });
    if (!restaurant) {
        throw new http_1.HttpError(404, "Restaurant not found");
    }
    if (auth.role !== client_1.UserRole.ADMIN && restaurant.ownerId !== auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    return restaurant;
}
menuRouter.get("/restaurant/:restaurantId", async (req, res) => {
    const restaurantId = (0, http_1.parseId)(String(req.params.restaurantId), "restaurant id");
    const categories = await prisma_1.prisma.menuCategory.findMany({
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
menuRouter.post("/category", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const input = categoryCreateSchema.parse(req.body);
    await assertRestaurantAccess(input.restaurant_id, req.auth);
    const category = await prisma_1.prisma.menuCategory.create({
        data: {
            restaurantId: input.restaurant_id,
            name: input.name,
        },
        include: { items: true },
    });
    res.status(201).json(mapCategory(category));
});
menuRouter.put("/category/:categoryId", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const categoryId = (0, http_1.parseId)(String(req.params.categoryId), "category id");
    const input = categoryUpdateSchema.parse(req.body);
    const existing = await prisma_1.prisma.menuCategory.findUnique({
        where: { id: categoryId },
        include: { items: true, restaurant: true },
    });
    if (!existing) {
        throw new http_1.HttpError(404, "Category not found");
    }
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        existing.restaurant.ownerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    const category = await prisma_1.prisma.menuCategory.update({
        where: { id: categoryId },
        data: { name: input.name },
        include: { items: true },
    });
    res.json(mapCategory(category));
});
menuRouter.delete("/category/:categoryId", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const categoryId = (0, http_1.parseId)(String(req.params.categoryId), "category id");
    const existing = await prisma_1.prisma.menuCategory.findUnique({
        where: { id: categoryId },
        include: { restaurant: true },
    });
    if (!existing) {
        throw new http_1.HttpError(404, "Category not found");
    }
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        existing.restaurant.ownerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    await prisma_1.prisma.menuCategory.delete({
        where: { id: categoryId },
    });
    res.status(204).send();
});
menuRouter.post("/item", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const input = menuItemCreateSchema.parse(req.body);
    await assertRestaurantAccess(input.restaurant_id, req.auth);
    const category = await prisma_1.prisma.menuCategory.findUnique({
        where: { id: input.category_id },
    });
    if (!category || category.restaurantId !== input.restaurant_id) {
        throw new http_1.HttpError(400, "Category does not belong to restaurant");
    }
    const item = await prisma_1.prisma.menuItem.create({
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
});
menuRouter.put("/item/:itemId", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const itemId = (0, http_1.parseId)(String(req.params.itemId), "item id");
    const input = menuItemUpdateSchema.parse(req.body);
    const existing = await prisma_1.prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { restaurant: true },
    });
    if (!existing) {
        throw new http_1.HttpError(404, "Menu item not found");
    }
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        existing.restaurant.ownerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    if (input.category_id !== undefined) {
        const category = await prisma_1.prisma.menuCategory.findUnique({
            where: { id: input.category_id },
        });
        if (!category || category.restaurantId !== existing.restaurantId) {
            throw new http_1.HttpError(400, "Category does not belong to restaurant");
        }
    }
    const item = await prisma_1.prisma.menuItem.update({
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
});
menuRouter.delete("/item/:itemId", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const itemId = (0, http_1.parseId)(String(req.params.itemId), "item id");
    const existing = await prisma_1.prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { restaurant: true },
    });
    if (!existing) {
        throw new http_1.HttpError(404, "Menu item not found");
    }
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        existing.restaurant.ownerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    await prisma_1.prisma.menuItem.delete({
        where: { id: itemId },
    });
    res.status(204).send();
});
