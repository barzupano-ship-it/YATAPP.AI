"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const client_1 = require("@prisma/client");
const http_1 = require("../../utils/http");
const alifpayService_1 = require("../../services/alifpayService");
const dcBankService_1 = require("../../services/dcBankService");
const client_2 = require("@prisma/client");
const paymentRouter = (0, express_1.Router)();
exports.paymentRouter = paymentRouter;
// Create payment link for order (customer only)
const createPaymentSchema = zod_1.z.object({
    order_id: zod_1.z.coerce.number().int().positive(),
    return_url: zod_1.z.string().url().optional(),
    provider: zod_1.z.enum(["alifpay", "dcbank"]).optional(),
});
function getPaymentProvider(provider) {
    if (provider === "dcbank" && (0, dcBankService_1.isDCBankConfigured)())
        return "dcbank";
    if (provider === "alifpay" && (0, alifpayService_1.isAlifpayConfigured)())
        return "alifpay";
    if ((0, alifpayService_1.isAlifpayConfigured)())
        return "alifpay";
    if ((0, dcBankService_1.isDCBankConfigured)())
        return "dcbank";
    throw new http_1.HttpError(503, "No payment system configured");
}
paymentRouter.post("/create", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.CUSTOMER, client_1.UserRole.ADMIN]), async (req, res) => {
    const input = createPaymentSchema.parse(req.body);
    const provider = getPaymentProvider(input.provider);
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: input.order_id },
        include: {
            customer: true,
            restaurant: true,
        },
    });
    if (!order)
        throw new http_1.HttpError(404, "Order not found");
    if (order.customerId !== req.auth.userId && req.auth.role !== client_1.UserRole.ADMIN) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    if (order.paymentStatus === client_2.PaymentStatus.PAID) {
        throw new http_1.HttpError(400, "Order is already paid");
    }
    if (provider === "alifpay" && !order.customer.phone?.trim()) {
        throw new http_1.HttpError(400, "Customer phone is required for Alifpay");
    }
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3002}`;
    const webhookUrl = provider === "dcbank"
        ? `${baseUrl}/api/payments/webhook/dcbank`
        : `${baseUrl}/api/payments/webhook`;
    let paymentUrl;
    let paymentId;
    if (provider === "alifpay") {
        const amountTiyn = Math.round(order.totalPrice * 100);
        const result = await (0, alifpayService_1.createInvoice)({
            orderId: order.id,
            amount: amountTiyn,
            description: `Order #${order.id} - ${order.restaurant.name}`,
            customerPhone: order.customer.phone || "",
            webhookUrl,
            returnUrl: input.return_url,
            metadata: { order_id: String(order.id) },
        });
        if (result.error)
            throw new http_1.HttpError(400, result.error.message);
        paymentUrl = result.url;
        paymentId = result.id;
    }
    else {
        const amountSomoni = order.totalPrice;
        const result = await (0, dcBankService_1.createPayment)({
            orderId: order.id,
            amount: amountSomoni,
            description: `Order #${order.id} - ${order.restaurant.name}`,
            customerPhone: order.customer.phone || undefined,
            webhookUrl,
            returnUrl: input.return_url,
            metadata: { order_id: String(order.id) },
        });
        if (result.error)
            throw new http_1.HttpError(400, result.error.message);
        paymentUrl = result.url ?? result.redirect_url;
        paymentId = result.payment_id;
    }
    await prisma_1.prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: client_2.PaymentStatus.AWAITING_PAYMENT,
            paymentId: paymentId ?? null,
        },
    });
    res.json({
        payment_url: paymentUrl,
        payment_id: paymentId,
        order_id: order.id,
        provider,
    });
});
// Webhook - Alifpay sends POST here when payment is completed
paymentRouter.post("/webhook", async (req, res) => {
    const signature = (req.headers["signature"] || req.headers["Signature"]);
    const rawBody = req.rawBody?.toString("utf8") ||
        JSON.stringify(req.body);
    if (!signature) {
        res.status(401).json({ error: "Missing signature" });
        return;
    }
    if (!(0, alifpayService_1.verifyWebhookSignature)(rawBody, signature)) {
        res.status(401).json({ error: "Invalid signature" });
        return;
    }
    const payload = req.body;
    const p = payload?.payload ?? payload;
    const meta = p?.metadata;
    const payId = payload?.payload?.id ?? payload?.payload?.purchase_id ?? null;
    const orderId = meta?.order_id ??
        p?.order_id ??
        payload?.order_id;
    if (!orderId) {
        res.status(400).json({ error: "Missing order_id in webhook" });
        return;
    }
    const id = parseInt(String(orderId), 10);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid order_id" });
        return;
    }
    try {
        await prisma_1.prisma.order.update({
            where: { id },
            data: {
                paymentStatus: client_2.PaymentStatus.PAID,
                paymentId: payId,
            },
        });
        res.status(200).json({ ok: true });
    }
    catch {
        res.status(500).json({ error: "Failed to update order" });
    }
});
// Webhook - Dushanbe City Bank callback (GET or POST redirect)
paymentRouter.all("/webhook/dcbank", async (req, res) => {
    const params = req.method === "GET"
        ? req.query
        : { ...req.query, ...req.body };
    const orderId = params.order_id ?? params.orderId;
    const signature = params.signature ?? params.sign;
    if (!orderId) {
        res.status(400).send("Missing order_id");
        return;
    }
    if (signature && !(0, dcBankService_1.verifyCallbackSignature)(params, signature)) {
        res.status(401).send("Invalid signature");
        return;
    }
    const id = parseInt(String(orderId), 10);
    if (isNaN(id)) {
        res.status(400).send("Invalid order_id");
        return;
    }
    try {
        await prisma_1.prisma.order.update({
            where: { id },
            data: {
                paymentStatus: client_2.PaymentStatus.PAID,
                paymentId: params.transaction_id ?? params.payment_id ?? params.id ?? null,
            },
        });
        const returnUrl = params.return_url ?? params.success_url;
        if (returnUrl && req.method === "GET") {
            res.redirect(returnUrl);
        }
        else {
            res.status(200).json({ ok: true });
        }
    }
    catch {
        res.status(500).json({ error: "Failed to update order" });
    }
});
// Get payment status for order
paymentRouter.get("/status/:orderId", auth_1.authenticate, async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.orderId ?? ""), "order id");
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true, paymentId: true, customerId: true },
    });
    if (!order)
        throw new http_1.HttpError(404, "Order not found");
    const isCustomer = order.customerId === req.auth.userId;
    const isAdmin = req.auth.role === client_1.UserRole.ADMIN;
    if (!isCustomer && !isAdmin) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    res.json({
        order_id: order.id,
        payment_status: order.paymentStatus,
        payment_id: order.paymentId,
    });
});
