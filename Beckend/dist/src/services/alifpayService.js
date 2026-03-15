"use strict";
/**
 * Alif Bank / Alifpay payment integration
 * Docs: https://docs.alifpay.uz/
 * API: https://api.alifpay.uz/v2 (production) https://api.alifpay.uz/v2 (sandbox)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoice = createInvoice;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.isAlifpayConfigured = isAlifpayConfigured;
const env_1 = require("../config/env");
const ALIFPAY_BASE_URL = env_1.env.ALIFPAY_API_URL || "https://api.alifpay.uz/v2";
function getHeaders() {
    const token = env_1.env.ALIFPAY_TOKEN;
    if (!token) {
        throw new Error("ALIFPAY_TOKEN is not set. Add it to .env to enable Alif Bank payments.");
    }
    return {
        "Content-Type": "application/json",
        Token: token,
    };
}
async function createInvoice(params) {
    const token = env_1.env.ALIFPAY_TOKEN;
    if (!token) {
        return {
            error: {
                code: 1002,
                message: "Alifpay not configured. Set ALIFPAY_TOKEN in .env",
            },
        };
    }
    // Alifpay API: https://docs.alifpay.uz/
    // Method names may vary - createInvoice, createBill, or similar
    // Contact Alifpay for exact API spec when you register at alifpay.uz
    const body = {
        amount: params.amount,
        description: params.description,
        phone: params.customerPhone.replace(/\D/g, "").slice(-9),
        webhook_url: params.webhookUrl,
        return_url: params.returnUrl,
        metadata: {
            order_id: String(params.orderId),
            ...params.metadata,
        },
    };
    try {
        const res = await fetch(`${ALIFPAY_BASE_URL}/createInvoice`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        const data = (await res.json());
        if (!res.ok) {
            return {
                error: {
                    code: res.status,
                    message: data.error?.message || res.statusText,
                },
            };
        }
        if (data.error) {
            return data;
        }
        return data;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
            error: { code: 1003, message: `Alifpay request failed: ${message}` },
        };
    }
}
function verifyWebhookSignature(body, signature) {
    const secret = env_1.env.ALIFPAY_SECRET;
    if (!secret)
        return false;
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(typeof body === "string" ? body : body.toString("utf8"));
    const expected = hmac.digest("base64");
    return expected === signature;
}
function isAlifpayConfigured() {
    return !!env_1.env.ALIFPAY_TOKEN;
}
