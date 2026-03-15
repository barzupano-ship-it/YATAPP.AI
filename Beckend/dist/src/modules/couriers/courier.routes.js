"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courierRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const courierRouter = (0, express_1.Router)();
exports.courierRouter = courierRouter;
const DEFAULT_DELIVERY_FEE = 12;
courierRouter.get("/me/delivery-fee", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    if (req.auth.role === client_1.UserRole.ADMIN) {
        return res.json({ delivery_fee: DEFAULT_DELIVERY_FEE });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.auth.userId },
        include: { courierCompany: true },
    });
    if (!user) {
        throw new http_1.HttpError(404, "User not found");
    }
    const deliveryFee = user.courierCompany?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
    res.json({ delivery_fee: deliveryFee });
});
