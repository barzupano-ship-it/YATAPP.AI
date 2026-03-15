import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { authenticate, requireRole } from "../../middleware/auth";
import { HttpError } from "../../utils/http";

const courierRouter = Router();
const DEFAULT_DELIVERY_FEE = 12;

courierRouter.get(
  "/me/delivery-fee",
  authenticate,
  requireRole([UserRole.COURIER, UserRole.ADMIN]),
  async (req, res) => {
    if (req.auth!.role === UserRole.ADMIN) {
      return res.json({ delivery_fee: DEFAULT_DELIVERY_FEE });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { courierCompany: true },
    });
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const deliveryFee =
      user.courierCompany?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
    res.json({ delivery_fee: deliveryFee });
  }
);

export { courierRouter };
