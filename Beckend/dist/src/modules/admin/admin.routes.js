"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const adminRouter = (0, express_1.Router)();
exports.adminRouter = adminRouter;
const createCourierSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email(),
    phone: zod_1.z.string().trim().min(1).optional(),
    password: zod_1.z.string().min(6),
});
const courierProfileSchema = zod_1.z.object({
    firstName: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    lastName: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    phone: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    inn: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    passportNumber: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    profilePhoto: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
    passportPhoto: zod_1.z.union([zod_1.z.string().trim(), zod_1.z.null()]).optional(),
});
function mapAdminUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        isModerator: user.isModerator,
        isSuperadmin: (0, auth_1.isSuperadminEmail)(user.email),
        isActive: user.isActive,
        restaurant_count: user._count.restaurants,
        created_at: user.createdAt,
    };
}
function mapCourierProfile(user) {
    return {
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone,
        profile_photo: user.profilePhoto,
        passport_photo: user.passportPhoto,
        inn: user.inn,
        passport_number: user.passportNumber,
    };
}
function mapAdminRestaurant(restaurant) {
    return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        description: restaurant.description,
        is_active: restaurant.isActive,
        created_at: restaurant.createdAt,
        owner: {
            id: restaurant.owner.id,
            name: restaurant.owner.name,
            email: restaurant.owner.email,
            isModerator: restaurant.owner.isModerator,
            isSuperadmin: (0, auth_1.isSuperadminEmail)(restaurant.owner.email),
        },
    };
}
adminRouter.get("/users", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    res.json(users.map(mapAdminUser));
});
adminRouter.post("/couriers", auth_1.authenticate, (0, auth_1.requireSuperadminAccess)(), async (req, res) => {
    const input = createCourierSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existing) {
        throw new http_1.HttpError(409, "User already exists");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const courier = await prisma_1.prisma.user.create({
        data: {
            name: input.name,
            email,
            phone: input.phone,
            passwordHash,
            role: client_1.UserRole.COURIER,
        },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    res.status(201).json(mapAdminUser(courier));
});
adminRouter.get("/couriers/pending", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (_req, res) => {
    const pending = await prisma_1.prisma.user.findMany({
        where: {
            role: client_1.UserRole.COURIER,
            courierCompanyId: { not: null },
            isActive: false,
        },
        include: {
            courierCompany: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(pending.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        created_at: u.createdAt,
        courier_company_id: u.courierCompanyId,
        courier_company_name: u.courierCompany?.name ?? null,
    })));
});
adminRouter.patch("/couriers/:id/approve", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (req, res) => {
    const userId = (0, http_1.parseId)(req.params.id, "user id");
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: { select: { restaurants: true } },
        },
    });
    if (!user || user.role !== client_1.UserRole.COURIER) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    if (!user.courierCompanyId) {
        throw new http_1.HttpError(400, "Courier was not created by a company");
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        include: {
            _count: { select: { restaurants: true } },
        },
    });
    res.json(mapAdminUser(updated));
});
adminRouter.get("/couriers/:id/profile", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (req, res) => {
    const userId = (0, http_1.parseId)(String(req.params.id), "user id");
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            profilePhoto: true,
            passportPhoto: true,
            inn: true,
            passportNumber: true,
        },
    });
    if (!user || user.role !== client_1.UserRole.COURIER) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    res.json(mapCourierProfile(user));
});
adminRouter.patch("/couriers/:id/profile", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (req, res) => {
    const userId = (0, http_1.parseId)(String(req.params.id), "user id");
    const input = courierProfileSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    if (!user || user.role !== client_1.UserRole.COURIER) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    const firstName = input.firstName !== undefined ? (input.firstName || null) : user.firstName;
    const lastName = input.lastName !== undefined ? (input.lastName || null) : user.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user.name;
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            name: fullName,
            firstName,
            lastName,
            phone: input.phone !== undefined ? (input.phone || null) : user.phone,
            inn: input.inn !== undefined ? (input.inn || null) : user.inn,
            passportNumber: input.passportNumber !== undefined ? (input.passportNumber || null) : user.passportNumber,
            profilePhoto: input.profilePhoto !== undefined ? input.profilePhoto : user.profilePhoto,
            passportPhoto: input.passportPhoto !== undefined ? input.passportPhoto : user.passportPhoto,
        },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    res.json({
        user: mapAdminUser(updatedUser),
        profile: mapCourierProfile(updatedUser),
    });
});
adminRouter.patch("/users/:id/moderator", auth_1.authenticate, (0, auth_1.requireSuperadminAccess)(), async (req, res) => {
    const userId = (0, http_1.parseId)(String(req.params.id), "user id");
    const enabled = req.body?.enabled;
    if (typeof enabled !== "boolean") {
        throw new http_1.HttpError(400, "enabled must be a boolean");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    if (!user) {
        throw new http_1.HttpError(404, "User not found");
    }
    if ((0, auth_1.isSuperadminEmail)(user.email)) {
        throw new http_1.HttpError(400, "Superadmin access cannot be changed");
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { isModerator: enabled },
        include: {
            _count: {
                select: {
                    restaurants: true,
                },
            },
        },
    });
    res.json(mapAdminUser(updatedUser));
});
adminRouter.delete("/users/:id", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (req, res) => {
    const userId = (0, http_1.parseId)(String(req.params.id), "user id");
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new http_1.HttpError(404, "User not found");
    }
    if ((0, auth_1.isSuperadminEmail)(user.email)) {
        throw new http_1.HttpError(400, "Superadmin account cannot be deleted");
    }
    if (req.auth.userId === user.id) {
        throw new http_1.HttpError(400, "You cannot delete your own account");
    }
    if (req.auth.isModerator && user.isModerator) {
        throw new http_1.HttpError(403, "Moderators cannot delete another moderator");
    }
    await prisma_1.prisma.user.delete({
        where: { id: userId },
    });
    res.status(204).send();
});
adminRouter.get("/restaurants", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (_req, res) => {
    const restaurants = await prisma_1.prisma.restaurant.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isModerator: true,
                },
            },
        },
    });
    res.json(restaurants.map(mapAdminRestaurant));
});
adminRouter.delete("/restaurants/:id", auth_1.authenticate, (0, auth_1.requireAdminAccess)(), async (req, res) => {
    const restaurantId = (0, http_1.parseId)(String(req.params.id), "restaurant id");
    const restaurant = await prisma_1.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
            owner: {
                select: {
                    email: true,
                },
            },
        },
    });
    if (!restaurant) {
        throw new http_1.HttpError(404, "Restaurant not found");
    }
    if (req.auth.isModerator && (0, auth_1.isSuperadminEmail)(restaurant.owner.email)) {
        throw new http_1.HttpError(403, "Moderators cannot delete superadmin restaurants");
    }
    await prisma_1.prisma.restaurant.delete({
        where: { id: restaurantId },
    });
    res.status(204).send();
});
