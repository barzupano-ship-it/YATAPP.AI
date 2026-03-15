"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpoPush = sendExpoPush;
exports.sendPushToUser = sendPushToUser;
exports.sendPushToUserId = sendPushToUserId;
const prisma_1 = require("../lib/prisma");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
async function sendExpoPush(message) {
    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: message.to,
                sound: message.sound ?? "default",
                title: message.title,
                body: message.body,
                data: message.data ?? {},
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            console.error("[push] Expo API error:", response.status, text);
            return false;
        }
        const result = await response.json();
        if (result.data?.status === "error") {
            console.error("[push] Expo error:", result.data.message);
            return false;
        }
        return true;
    }
    catch (err) {
        console.error("[push] Send failed:", err);
        return false;
    }
}
async function sendPushToUser(pushToken, title, body, data) {
    if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) {
        return false;
    }
    return sendExpoPush({ to: pushToken, title, body, data });
}
async function sendPushToUserId(userId, title, body, data) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
    });
    if (!user?.pushToken)
        return false;
    return sendPushToUser(user.pushToken, title, body, data);
}
