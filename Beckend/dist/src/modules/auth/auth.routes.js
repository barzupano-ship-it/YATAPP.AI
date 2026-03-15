"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
const roleSchema = zod_1.z
    .enum(["customer", "restaurant", "courier_company"])
    .transform((role) => role.toUpperCase());
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email(),
    phone: zod_1.z.string().trim().min(1).optional(),
    password: zod_1.z.string().min(6),
    role: roleSchema.default(client_1.UserRole.CUSTOMER),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().min(1),
});
const pushTokenSchema = zod_1.z.object({
    push_token: zod_1.z.string().trim().min(1),
});
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        isModerator: user.isModerator,
        isSuperadmin: (0, auth_1.isSuperadminEmail)(user.email),
    };
}
authRouter.post("/register", async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
    });
    if (existing) {
        throw new http_1.HttpError(409, "User already exists");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone,
            passwordHash,
            role: input.role,
        },
    });
    const token = (0, auth_1.signToken)({
        userId: user.id,
        role: user.role,
    });
    res.status(201).json({
        user: toPublicUser(user),
        token,
    });
});
authRouter.post("/login", async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
    });
    if (!user) {
        throw new http_1.HttpError(401, "Invalid credentials");
    }
    const isValid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!isValid) {
        throw new http_1.HttpError(401, "Invalid credentials");
    }
    const token = (0, auth_1.signToken)({
        userId: user.id,
        role: user.role,
    });
    res.json({
        user: toPublicUser(user),
        token,
    });
});
authRouter.get("/me", auth_1.authenticate, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isModerator: true,
        },
    });
    if (!user) {
        throw new http_1.HttpError(404, "User not found");
    }
    res.json(toPublicUser(user));
});
authRouter.patch("/me/push-token", auth_1.authenticate, async (req, res) => {
    const input = pushTokenSchema.parse(req.body);
    await prisma_1.prisma.user.update({
        where: { id: req.auth.userId },
        data: { pushToken: input.push_token },
    });
    res.json({ ok: true });
});
