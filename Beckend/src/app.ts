import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { restaurantRouter } from "./modules/restaurants/restaurant.routes";
import { menuRouter } from "./modules/menu/menu.routes";
import { orderRouter } from "./modules/orders/order.routes";
import { courierCompanyRouter } from "./modules/courier-company/courier-company.routes";
import { courierRouter } from "./modules/couriers/courier.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/restaurants", restaurantRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/courier-company", courierCompanyRouter);
  app.use("/api/couriers", courierRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
