"use strict";
/**
 * Dushanbe City Bank payment integration
 * Platform: https://acquiring.dc.tj/
 * Contact: info@dc.tj, +992 44 630 99 99
 *
 * Integration: 1) Application 2) Contract 3) Install code
 * API docs versions 1.3-1.8 (obtain from bank after registration)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDCBankConfigured = isDCBankConfigured;
exports.createPayment = createPayment;
exports.verifyCallbackSignature = verifyCallbackSignature;
const env_1 = require("../config/env");
const crypto = __importStar(require("crypto"));
const DCBANK_BASE_URL = env_1.env.DCBANK_API_URL || "https://acquiring.dc.tj";
const DCBANK_TEST_URL = "https://acquiring.dc.tj/pay/pay_test_new.php";
function isDCBankConfigured() {
    return !!(env_1.env.DCBANK_MERCHANT_ID &&
        env_1.env.DCBANK_TERMINAL_ID &&
        env_1.env.DCBANK_SECRET_KEY);
}
function buildSignature(params) {
    const secret = env_1.env.DCBANK_SECRET_KEY;
    const sortedKeys = Object.keys(params).sort();
    const str = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
    return crypto.createHmac("sha256", secret).update(str).digest("hex");
}
/**
 * Create payment - redirect URL for Dushanbe City Bank acquiring
 * Exact API structure depends on bank's documentation (v1.3-1.8)
 * Contact bank for: merchant_id, terminal_id, secret_key, API format
 */
async function createPayment(params) {
    const merchantId = env_1.env.DCBANK_MERCHANT_ID;
    const terminalId = env_1.env.DCBANK_TERMINAL_ID;
    if (!merchantId || !terminalId || !env_1.env.DCBANK_SECRET_KEY) {
        return {
            error: {
                code: 1002,
                message: "Dushanbe City Bank not configured. Set DCBANK_MERCHANT_ID, DCBANK_TERMINAL_ID, DCBANK_SECRET_KEY in .env",
            },
        };
    }
    const amountSomoni = params.amount.toFixed(2);
    const orderIdStr = String(params.orderId);
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 14);
    const formParams = {
        merchant_id: merchantId,
        terminal_id: terminalId,
        order_id: orderIdStr,
        amount: amountSomoni,
        currency: "972", // TJS
        description: params.description.slice(0, 255),
        callback_url: params.webhookUrl,
        return_url: params.returnUrl || params.webhookUrl,
        ...(params.customerPhone && { phone: params.customerPhone.replace(/\D/g, "").slice(-9) }),
        ...(params.customerEmail && { email: params.customerEmail }),
        timestamp,
    };
    const signature = buildSignature(formParams);
    formParams.signature = signature;
    const baseUrl = env_1.env.DCBANK_SANDBOX ? DCBANK_TEST_URL : `${DCBANK_BASE_URL}/pay`;
    const query = new URLSearchParams(formParams).toString();
    const paymentUrl = `${baseUrl}?${query}`;
    return {
        url: paymentUrl,
        redirect_url: paymentUrl,
        payment_id: orderIdStr,
    };
}
/**
 * Verify webhook/callback from Dushanbe City Bank
 * Signature format may vary - check bank's API docs
 */
function verifyCallbackSignature(params, receivedSignature) {
    const secret = env_1.env.DCBANK_SECRET_KEY;
    if (!secret)
        return false;
    const { signature, ...rest } = params;
    const expected = buildSignature(rest);
    return expected === receivedSignature || expected === signature;
}
