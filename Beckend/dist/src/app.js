"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const error_handler_1 = require("./middleware/error-handler");
const auth_routes_1 = require("./modules/auth/auth.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const restaurant_routes_1 = require("./modules/restaurants/restaurant.routes");
const menu_routes_1 = require("./modules/menu/menu.routes");
const order_routes_1 = require("./modules/orders/order.routes");
const courier_company_routes_1 = require("./modules/courier-company/courier-company.routes");
const courier_routes_1 = require("./modules/couriers/courier.routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.CORS_ORIGIN === "*" ? true : env_1.env.CORS_ORIGIN.split(","),
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "10mb" }));
    app.get("/api/health", (_req, res) => {
        res.json({ ok: true });
    });
    app.use("/api/auth", auth_routes_1.authRouter);
    app.use("/api/admin", admin_routes_1.adminRouter);
    app.use("/api/restaurants", restaurant_routes_1.restaurantRouter);
    app.use("/api/menu", menu_routes_1.menuRouter);
    app.use("/api/orders", order_routes_1.orderRouter);
    app.use("/api/courier-company", courier_company_routes_1.courierCompanyRouter);
    app.use("/api/couriers", courier_routes_1.courierRouter);
    app.use(error_handler_1.notFoundHandler);
    app.use(error_handler_1.errorHandler);
    return app;
}
