"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.isSuperadminEmail = isSuperadminEmail;
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireAdminAccess = requireAdminAccess;
exports.requireSuperadminAccess = requireSuperadminAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const http_1 = require("../utils/http");
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
function readBearerToken(req) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return null;
    return header.slice("Bearer ".length);
}
function isSuperadminEmail(email) {
    return email.trim().toLowerCase() === env_1.env.SUPERADMIN_EMAIL.toLowerCase();
}
async function authenticate(req, _res, next) {
    const token = readBearerToken(req);
    if (!token) {
        return next(new http_1.HttpError(401, "Unauthorized"));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isModerator: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            return next(new http_1.HttpError(401, "Unauthorized"));
        }
        req.auth = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isModerator: user.isModerator,
            isSuperadmin: isSuperadminEmail(user.email),
        };
        next();
    }
    catch {
        next(new http_1.HttpError(401, "Invalid token"));
    }
}
function requireRole(roles) {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new http_1.HttpError(401, "Unauthorized"));
        }
        if (!roles.includes(req.auth.role)) {
            return next(new http_1.HttpError(403, "Forbidden"));
        }
        next();
    };
}
function requireAdminAccess() {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new http_1.HttpError(401, "Unauthorized"));
        }
        if (!req.auth.isSuperadmin && !req.auth.isModerator) {
            return next(new http_1.HttpError(403, "Forbidden"));
        }
        next();
    };
}
function requireSuperadminAccess() {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new http_1.HttpError(401, "Unauthorized"));
        }
        if (!req.auth.isSuperadmin) {
            return next(new http_1.HttpError(403, "Forbidden"));
        }
        next();
    };
}
