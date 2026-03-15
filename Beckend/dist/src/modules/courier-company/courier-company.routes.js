"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courierCompanyRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const courierCompanyRouter = (0, express_1.Router)();
exports.courierCompanyRouter = courierCompanyRouter;
const registerSchema = zod_1.z.object({
    company_name: zod_1.z.string().trim().min(1),
    owner_name: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email(),
    phone: zod_1.z.string().trim().optional(),
    password: zod_1.z.string().min(6),
});
courierCompanyRouter.post("/register", async (req, res) => {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existing) {
        throw new http_1.HttpError(409, "User already exists");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            name: input.owner_name,
            email,
            phone: input.phone,
            passwordHash,
            role: "COURIER_COMPANY",
        },
    });
    const company = await prisma_1.prisma.courierCompany.create({
        data: {
            name: input.company_name,
            ownerId: user.id,
        },
    });
    const token = (0, auth_1.signToken)({
        userId: user.id,
        role: user.role,
    });
    res.status(201).json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: "courier_company",
        },
        company_id: company.id,
        token,
    });
});
const createCourierSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email(),
    phone: zod_1.z.string().trim().optional(),
    password: zod_1.z.string().min(6),
});
const MAX_DELIVERY_FEE = 20;
const updateCompanySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    delivery_fee: zod_1.z
        .coerce.number()
        .min(0)
        .max(MAX_DELIVERY_FEE, { message: "Максимальная стоимость доставки — 20 сомони" })
        .optional(),
    phone: zod_1.z.string().trim().optional().nullable(),
    address: zod_1.z.string().trim().optional().nullable(),
});
courierCompanyRouter.get("/me", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY, client_1.UserRole.ADMIN]), async (req, res) => {
    if (req.auth.role === client_1.UserRole.ADMIN) {
        throw new http_1.HttpError(400, "Admin must specify company");
    }
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
        include: {
            _count: { select: { couriers: true } },
        },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    res.json({
        id: company.id,
        name: company.name,
        delivery_fee: company.deliveryFee,
        phone: company.phone,
        address: company.address,
        courier_count: company._count.couriers,
        created_at: company.createdAt,
    });
});
courierCompanyRouter.patch("/me", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const input = updateCompanySchema.parse(req.body);
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    const updated = await prisma_1.prisma.courierCompany.update({
        where: { id: company.id },
        data: {
            ...(input.name != null && { name: input.name }),
            ...(input.delivery_fee != null && { deliveryFee: input.delivery_fee }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.address !== undefined && { address: input.address }),
        },
    });
    res.json({
        id: updated.id,
        name: updated.name,
        delivery_fee: updated.deliveryFee,
        phone: updated.phone,
        address: updated.address,
    });
});
courierCompanyRouter.get("/couriers", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    const couriers = await prisma_1.prisma.user.findMany({
        where: {
            courierCompanyId: company.id,
            role: client_1.UserRole.COURIER,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(couriers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        is_active: c.isActive,
        created_at: c.createdAt,
    })));
});
courierCompanyRouter.post("/couriers", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
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
            courierCompanyId: company.id,
            isActive: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
        },
    });
    res.status(201).json({
        id: courier.id,
        name: courier.name,
        email: courier.email,
        phone: courier.phone,
        is_active: courier.isActive,
        created_at: courier.createdAt,
    });
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
courierCompanyRouter.get("/couriers/:id/profile", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    const courierId = (0, http_1.parseId)(req.params.id, "courier id");
    const courier = await prisma_1.prisma.user.findFirst({
        where: { id: courierId, courierCompanyId: company.id },
        select: {
            firstName: true,
            lastName: true,
            phone: true,
            profilePhoto: true,
            passportPhoto: true,
            inn: true,
            passportNumber: true,
        },
    });
    if (!courier) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    res.json(mapCourierProfile(courier));
});
courierCompanyRouter.patch("/couriers/:id/profile", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    const courierId = (0, http_1.parseId)(req.params.id, "courier id");
    const courier = await prisma_1.prisma.user.findFirst({
        where: { id: courierId, courierCompanyId: company.id },
    });
    if (!courier) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    const input = courierProfileSchema.parse(req.body);
    const firstName = input.firstName !== undefined ? input.firstName : courier.firstName;
    const lastName = input.lastName !== undefined ? input.lastName : courier.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || courier.name;
    const updated = await prisma_1.prisma.user.update({
        where: { id: courierId },
        data: {
            name: fullName,
            firstName,
            lastName,
            phone: input.phone !== undefined ? input.phone : courier.phone,
            inn: input.inn !== undefined ? input.inn : courier.inn,
            passportNumber: input.passportNumber !== undefined ? input.passportNumber : courier.passportNumber,
            profilePhoto: input.profilePhoto !== undefined ? input.profilePhoto : courier.profilePhoto,
            passportPhoto: input.passportPhoto !== undefined ? input.passportPhoto : courier.passportPhoto,
        },
    });
    res.json({
        courier: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            is_active: updated.isActive,
            created_at: updated.createdAt,
        },
        profile: mapCourierProfile(updated),
    });
});
courierCompanyRouter.delete("/couriers/:id", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER_COMPANY]), async (req, res) => {
    const company = await prisma_1.prisma.courierCompany.findFirst({
        where: { ownerId: req.auth.userId },
    });
    if (!company) {
        throw new http_1.HttpError(404, "Courier company not found");
    }
    const courierId = (0, http_1.parseId)(req.params.id, "courier id");
    const courier = await prisma_1.prisma.user.findUnique({
        where: { id: courierId },
    });
    if (!courier || courier.courierCompanyId !== company.id) {
        throw new http_1.HttpError(404, "Courier not found");
    }
    await prisma_1.prisma.user.update({
        where: { id: courierId },
        data: { courierCompanyId: null },
    });
    res.json({ ok: true });
});
