"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const http_1 = require("../../utils/http");
const geocode_1 = require("../../utils/geocode");
const pushNotification_1 = require("../../services/pushNotification");
const orderRouter = (0, express_1.Router)();
exports.orderRouter = orderRouter;
const createOrderSchema = zod_1.z.object({
    restaurant_id: zod_1.z.coerce.number().int().positive(),
    delivery_address: zod_1.z.string().trim().min(1),
    delivery_latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    delivery_longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    delivery_google_maps_url: zod_1.z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((v) => (!v || v === '' ? null : v)),
    items: zod_1.z
        .array(zod_1.z.object({
        menu_item_id: zod_1.z.coerce.number().int().positive(),
        quantity: zod_1.z.coerce.number().int().positive().default(1),
    }))
        .min(1),
});
const updateCourierLocationSchema = zod_1.z.object({
    latitude: zod_1.z.coerce.number().min(-90).max(90),
    longitude: zod_1.z.coerce.number().min(-180).max(180),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "pending",
        "accepted",
        "preparing",
        "ready",
        "picked_up",
        "delivering",
        "delivered",
        "cancelled",
    ]),
});
function toPrismaStatus(status) {
    return status.toUpperCase();
}
function fromPrismaStatus(status) {
    return status.toLowerCase();
}
function mapOrderItem(item) {
    return {
        id: item.id,
        menu_item_id: item.menuItemId,
        menu_item_name: item.nameSnapshot,
        name: item.nameSnapshot,
        price: item.priceSnapshot,
        quantity: item.quantity,
    };
}
function mapOrder(order) {
    return {
        id: order.id,
        customer_id: order.customerId,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        restaurant_id: order.restaurantId,
        restaurant_name: order.restaurant.name,
        alif_bank_card_number: order.restaurant.alifBankCardNumber ?? undefined,
        alif_bank_wallet_number: order.restaurant.alifBankWalletNumber ?? undefined,
        dc_bank_card_number: order.restaurant.dcBankCardNumber ?? undefined,
        dc_bank_wallet_number: order.restaurant.dcBankWalletNumber ?? undefined,
        courier_id: order.courierId,
        courier_name: order.courier?.name ?? null,
        courier_phone: order.courier?.phone ?? null,
        items: order.items.map(mapOrderItem),
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        total_price: order.totalPrice,
        status: fromPrismaStatus(order.status),
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        accepted_at: order.acceptedAt,
        picked_up_at: order.pickedUpAt,
        delivered_at: order.deliveredAt,
        delivery_address: order.deliveryAddress,
        pickup_address: order.pickupAddress,
        pickup_latitude: order.pickupLatitude,
        pickup_longitude: order.pickupLongitude,
        delivery_latitude: order.deliveryLatitude,
        delivery_longitude: order.deliveryLongitude,
        delivery_google_maps_url: order.deliveryGoogleMapsUrl,
        receipt_screen_url: order.receiptScreenUrl ?? undefined,
        courier_latitude: order.courierLatitude ?? undefined,
        courier_longitude: order.courierLongitude ?? undefined,
    };
}
async function findOrderOrThrow(orderId) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
    });
    if (!order) {
        throw new http_1.HttpError(404, "Order not found");
    }
    return order;
}
orderRouter.post("/", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.CUSTOMER, client_1.UserRole.ADMIN]), async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const restaurant = await prisma_1.prisma.restaurant.findUnique({
        where: { id: input.restaurant_id },
        include: { menuItems: true },
    });
    if (!restaurant) {
        throw new http_1.HttpError(404, "Restaurant not found");
    }
    const menuItems = input.items.map((item) => item.menu_item_id);
    const existingItems = await prisma_1.prisma.menuItem.findMany({
        where: {
            id: { in: menuItems },
            restaurantId: input.restaurant_id,
            available: true,
        },
    });
    if (existingItems.length !== input.items.length) {
        throw new http_1.HttpError(400, "One or more menu items are unavailable");
    }
    const itemMap = new Map(existingItems.map((item) => [item.id, item]));
    const subtotal = input.items.reduce((sum, item) => {
        const menuItem = itemMap.get(item.menu_item_id);
        return sum + menuItem.price * item.quantity;
    }, 0);
    const deliveryFee = 12;
    const totalPrice = subtotal + deliveryFee;
    const hasClientCoords = input.delivery_latitude != null &&
        input.delivery_longitude != null &&
        Number.isFinite(input.delivery_latitude) &&
        Number.isFinite(input.delivery_longitude);
    let deliveryLatitude = hasClientCoords
        ? input.delivery_latitude
        : null;
    let deliveryLongitude = hasClientCoords
        ? input.delivery_longitude
        : null;
    if (!hasClientCoords) {
        try {
            const geocoded = await (0, geocode_1.geocodeAddress)(input.delivery_address);
            if (geocoded) {
                deliveryLatitude = geocoded.latitude;
                deliveryLongitude = geocoded.longitude;
            }
        }
        catch {
            // Keep null coords if geocoding fails
        }
    }
    const order = await prisma_1.prisma.order.create({
        data: {
            customerId: req.auth.userId,
            restaurantId: restaurant.id,
            deliveryAddress: input.delivery_address,
            deliveryLatitude,
            deliveryLongitude,
            deliveryGoogleMapsUrl: input.delivery_google_maps_url ?? null,
            pickupAddress: restaurant.address,
            pickupLatitude: restaurant.latitude,
            pickupLongitude: restaurant.longitude,
            subtotal,
            deliveryFee,
            totalPrice,
            items: {
                create: input.items.map((item) => {
                    const menuItem = itemMap.get(item.menu_item_id);
                    return {
                        menuItemId: menuItem.id,
                        nameSnapshot: menuItem.name,
                        priceSnapshot: menuItem.price,
                        quantity: item.quantity,
                    };
                }),
            },
        },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
    });
    (0, pushNotification_1.sendPushToUserId)(restaurant.ownerId, "Нове замовлення", `Замовлення #${order.id} від ${order.customer.name}`, { orderId: order.id, type: "new_order" }).catch((e) => console.error("[push] new order:", e));
    res.status(201).json(mapOrder(order));
});
orderRouter.get("/customer", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.CUSTOMER, client_1.UserRole.ADMIN]), async (req, res) => {
    const where = req.auth.role === client_1.UserRole.ADMIN ? {} : { customerId: req.auth.userId };
    const orders = await prisma_1.prisma.order.findMany({
        where,
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(mapOrder));
});
orderRouter.get("/restaurant", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN]), async (req, res) => {
    const restaurantId = (0, http_1.parseId)(String(req.query.restaurant_id ?? ""), "restaurant id");
    const restaurant = await prisma_1.prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });
    if (!restaurant) {
        throw new http_1.HttpError(404, "Restaurant not found");
    }
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        restaurant.ownerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    const orders = await prisma_1.prisma.order.findMany({
        where: { restaurantId },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(mapOrder));
});
orderRouter.get("/courier", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    const baseWhere = req.auth.role === client_1.UserRole.ADMIN ? {} : { courierId: req.auth.userId };
    const includeHidden = req.query.includeHidden === "true";
    const where = req.auth.role === client_1.UserRole.ADMIN || includeHidden
        ? baseWhere
        : {
            ...baseWhere,
            archiveHiddenBy: { none: { courierId: req.auth.userId } },
        };
    const orders = await prisma_1.prisma.order.findMany({
        where,
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(mapOrder));
});
orderRouter.put("/:id/hide-from-archive", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    const orderId = (0, http_1.parseId)(req.params.id, "order id");
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        select: { courierId: true, status: true },
    });
    if (!order)
        throw new http_1.HttpError(404, "Order not found");
    if (req.auth.role !== client_1.UserRole.ADMIN &&
        order.courierId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    const status = String(order.status).toLowerCase();
    if (status !== "delivered" && status !== "cancelled") {
        throw new http_1.HttpError(400, "Only delivered or cancelled orders can be hidden from archive");
    }
    await prisma_1.prisma.courierArchiveHidden.upsert({
        where: {
            courierId_orderId: {
                courierId: req.auth.userId,
                orderId,
            },
        },
        create: {
            courierId: req.auth.userId,
            orderId,
        },
        update: {},
    });
    res.json({ ok: true });
});
orderRouter.get("/available", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    const cityParam = typeof req.query.city === "string" ? req.query.city.trim() : undefined;
    const where = {
        courierId: null,
        status: {
            in: [
                client_1.OrderStatus.PENDING,
                client_1.OrderStatus.ACCEPTED,
                client_1.OrderStatus.PREPARING,
                client_1.OrderStatus.READY,
            ],
        },
        ...(cityParam ? { restaurant: { city: cityParam } } : {}),
    };
    const orders = await prisma_1.prisma.order.findMany({
        where,
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
        orderBy: { createdAt: "asc" },
    });
    res.json(orders.map(mapOrder));
});
orderRouter.post("/:id/accept", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
    const order = await findOrderOrThrow(orderId);
    if (order.courierId && req.auth.role !== client_1.UserRole.ADMIN) {
        throw new http_1.HttpError(409, "Order already assigned");
    }
    if (order.status !== client_1.OrderStatus.READY && req.auth.role !== client_1.UserRole.ADMIN) {
        throw new http_1.HttpError(400, "Order is not ready for pickup");
    }
    let deliveryFeeUpdate = {};
    const courierUser = await prisma_1.prisma.user.findUnique({
        where: { id: req.auth.userId },
        include: { courierCompany: true },
    });
    if (courierUser?.courierCompany) {
        deliveryFeeUpdate = {
            deliveryFee: courierUser.courierCompany.deliveryFee,
            totalPrice: order.subtotal + courierUser.courierCompany.deliveryFee,
        };
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            courierId: req.auth.userId,
            acceptedAt: new Date(),
            ...deliveryFeeUpdate,
        },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
    });
    (0, pushNotification_1.sendPushToUserId)(order.restaurant.ownerId, "Кур'єр прийняв замовлення", `Замовлення #${orderId} прийняте кур'єром`, { orderId, type: "order_accepted" }).catch((e) => console.error("[push] order accepted (restaurant):", e));
    (0, pushNotification_1.sendPushToUserId)(order.customer.id, "Кур'єр прийняв замовлення", `Ваше замовлення #${orderId} прийняте кур'єром`, { orderId, type: "order_accepted" }).catch((e) => console.error("[push] order accepted (customer):", e));
    res.json(mapOrder(updated));
});
orderRouter.get("/:id", auth_1.authenticate, async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
    const order = await findOrderOrThrow(orderId);
    const isAdmin = req.auth.role === client_1.UserRole.ADMIN;
    const isCustomer = order.customerId === req.auth.userId;
    const isCourier = order.courierId === req.auth.userId;
    const isRestaurantOwner = order.restaurant.ownerId === req.auth.userId;
    if (!isAdmin && !isCustomer && !isCourier && !isRestaurantOwner) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    res.json(mapOrder({
        ...order,
        restaurant: {
            id: order.restaurant.id,
            name: order.restaurant.name,
            address: order.restaurant.address,
        },
        courier: order.courier,
    }));
});
orderRouter.put("/:id/courier-location", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.COURIER, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
        const input = updateCourierLocationSchema.parse(req.body);
        const order = await findOrderOrThrow(orderId);
        if (order.courierId !== req.auth.userId && req.auth.role !== client_1.UserRole.ADMIN) {
            throw new http_1.HttpError(403, "Forbidden");
        }
        if (order.status !== client_1.OrderStatus.PICKED_UP && order.status !== client_1.OrderStatus.DELIVERING && req.auth.role !== client_1.UserRole.ADMIN) {
            throw new http_1.HttpError(400, "Can only update location for active delivery");
        }
        await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                courierLatitude: input.latitude,
                courierLongitude: input.longitude,
            },
        });
        res.json({ ok: true });
    }
    catch (err) {
        if (err instanceof http_1.HttpError)
            throw err;
        console.error("[courier-location] Error:", err);
        throw new http_1.HttpError(500, err instanceof Error ? err.message : "Failed to update courier location");
    }
});
orderRouter.put("/:id/status", auth_1.authenticate, async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
    const input = updateStatusSchema.parse(req.body);
    const nextStatus = toPrismaStatus(input.status);
    const order = await findOrderOrThrow(orderId);
    const isAdmin = req.auth.role === client_1.UserRole.ADMIN;
    const isRestaurantOwner = order.restaurant.ownerId === req.auth.userId;
    const isCourier = order.courierId === req.auth.userId;
    const restaurantStatuses = [
        client_1.OrderStatus.ACCEPTED,
        client_1.OrderStatus.PREPARING,
        client_1.OrderStatus.READY,
        client_1.OrderStatus.PICKED_UP,
        client_1.OrderStatus.DELIVERING,
        client_1.OrderStatus.DELIVERED,
        client_1.OrderStatus.CANCELLED,
    ];
    const courierStatuses = [
        client_1.OrderStatus.PICKED_UP,
        client_1.OrderStatus.DELIVERING,
        client_1.OrderStatus.DELIVERED,
    ];
    const allowedNextStatusMap = {
        [client_1.OrderStatus.PENDING]: [
            client_1.OrderStatus.ACCEPTED,
            client_1.OrderStatus.PREPARING,
            client_1.OrderStatus.CANCELLED,
        ],
        [client_1.OrderStatus.ACCEPTED]: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.PREPARING]: [client_1.OrderStatus.READY, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.READY]: [client_1.OrderStatus.PICKED_UP, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.PICKED_UP]: [client_1.OrderStatus.DELIVERING, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.DELIVERING]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.DELIVERED]: [client_1.OrderStatus.CANCELLED],
    };
    if (!isAdmin) {
        const isRestaurantManagedStatus = restaurantStatuses.includes(nextStatus);
        const isCourierManagedStatus = courierStatuses.includes(nextStatus);
        const canRestaurantManage = isRestaurantOwner && isRestaurantManagedStatus;
        const canCourierManage = isCourier && isCourierManagedStatus;
        if (!isRestaurantManagedStatus && !isCourierManagedStatus) {
            throw new http_1.HttpError(400, "Unsupported status transition");
        }
        if (!canRestaurantManage && !canCourierManage) {
            throw new http_1.HttpError(403, "Forbidden");
        }
        const allowedStatuses = allowedNextStatusMap[order.status] ?? [];
        if (!allowedStatuses.includes(nextStatus)) {
            throw new http_1.HttpError(400, "Cannot set this status yet");
        }
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: nextStatus,
            ...(nextStatus === client_1.OrderStatus.PICKED_UP
                ? { pickedUpAt: new Date() }
                : {}),
            ...(nextStatus === client_1.OrderStatus.DELIVERED
                ? { deliveredAt: new Date() }
                : {}),
        },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: { id: true, name: true, address: true, ownerId: true },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
    });
    const pushMessages = [];
    if (nextStatus === client_1.OrderStatus.ACCEPTED) {
        pushMessages.push({ userId: order.customer.id, title: "Замовлення прийнято", body: `Замовлення #${orderId} прийнято рестораном` }, { userId: order.restaurant.ownerId, title: "Замовлення прийнято", body: `Замовлення #${orderId} прийнято` });
    }
    else if (nextStatus === client_1.OrderStatus.PREPARING) {
        pushMessages.push({ userId: order.customer.id, title: "Готується", body: `Замовлення #${orderId} готується` });
    }
    else if (nextStatus === client_1.OrderStatus.READY) {
        pushMessages.push({ userId: order.customer.id, title: "Готово до доставки", body: `Замовлення #${orderId} готове` });
        if (updated.courier?.id) {
            pushMessages.push({ userId: updated.courier.id, title: "Нове замовлення для доставки", body: `Замовлення #${orderId} готове до отримання` });
        }
    }
    else if (nextStatus === client_1.OrderStatus.PICKED_UP) {
        pushMessages.push({ userId: order.customer.id, title: "Кур'єр забрав замовлення", body: `Замовлення #${orderId} в дорозі` }, { userId: order.restaurant.ownerId, title: "Кур'єр забрав замовлення", body: `Замовлення #${orderId} забрано кур'єром` });
    }
    else if (nextStatus === client_1.OrderStatus.DELIVERING) {
        pushMessages.push({ userId: order.customer.id, title: "Доставляється", body: `Замовлення #${orderId} доставляється` });
    }
    else if (nextStatus === client_1.OrderStatus.DELIVERED) {
        pushMessages.push({ userId: order.customer.id, title: "Доставлено", body: `Замовлення #${orderId} доставлено` }, { userId: order.restaurant.ownerId, title: "Замовлення доставлено", body: `Замовлення #${orderId} доставлено` });
        if (order.courier?.id) {
            pushMessages.push({ userId: order.courier.id, title: "Замовлення доставлено", body: `Замовлення #${orderId} успішно доставлено` });
        }
    }
    else if (nextStatus === client_1.OrderStatus.CANCELLED) {
        pushMessages.push({ userId: order.customer.id, title: "Замовлення скасовано", body: `Замовлення #${orderId} скасовано` });
        pushMessages.push({ userId: order.restaurant.ownerId, title: "Замовлення скасовано", body: `Замовлення #${orderId} скасовано` });
        if (order.courier?.id) {
            pushMessages.push({ userId: order.courier.id, title: "Замовлення скасовано", body: `Замовлення #${orderId} скасовано` });
        }
    }
    for (const msg of pushMessages) {
        (0, pushNotification_1.sendPushToUserId)(msg.userId, msg.title, msg.body, { orderId, type: "order_status" }).catch((e) => console.error("[push] order status:", e));
    }
    res.json(mapOrder(updated));
});
orderRouter.post("/:id/cancel", auth_1.authenticate, (0, auth_1.requireRole)([client_1.UserRole.CUSTOMER, client_1.UserRole.ADMIN]), async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
    const order = await findOrderOrThrow(orderId);
    if (req.auth.role !== client_1.UserRole.ADMIN && order.customerId !== req.auth.userId) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    const cancellableStatuses = [client_1.OrderStatus.PENDING, client_1.OrderStatus.ACCEPTED];
    if (!cancellableStatuses.includes(order.status)) {
        throw new http_1.HttpError(400, "Order can only be cancelled before preparation starts");
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status: client_1.OrderStatus.CANCELLED },
        include: {
            customer: { select: { id: true, name: true, phone: true } },
            restaurant: { select: { id: true, name: true, address: true, ownerId: true } },
            courier: { select: { id: true, name: true, phone: true } },
            items: true,
        },
    });
    (0, pushNotification_1.sendPushToUserId)(order.restaurant.ownerId, "Заказ отменён", `Заказ #${orderId} отменён клиентом`, { orderId, type: "order_status" }).catch((e) => console.error("[push] order cancelled:", e));
    res.json(mapOrder(updated));
});
const updateReceiptSchema = zod_1.z.object({
    receipt_screen_url: zod_1.z.string().trim().min(1),
});
orderRouter.put("/:id/receipt", auth_1.authenticate, async (req, res) => {
    const orderId = (0, http_1.parseId)(String(req.params.id), "order id");
    const input = updateReceiptSchema.parse(req.body);
    const order = await findOrderOrThrow(orderId);
    const isAdmin = req.auth.role === client_1.UserRole.ADMIN;
    const isRestaurantOwner = order.restaurant.ownerId === req.auth.userId;
    const isCustomer = order.customerId === req.auth.userId;
    if (!isAdmin && !isRestaurantOwner && !isCustomer) {
        throw new http_1.HttpError(403, "Forbidden");
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { receiptScreenUrl: input.receipt_screen_url },
        include: {
            customer: {
                select: { id: true, name: true, phone: true },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    ownerId: true,
                    alifBankCardNumber: true,
                    alifBankWalletNumber: true,
                    dcBankCardNumber: true,
                    dcBankWalletNumber: true,
                },
            },
            courier: {
                select: { id: true, name: true, phone: true },
            },
            items: true,
        },
    });
    res.json(mapOrder(updated));
});
